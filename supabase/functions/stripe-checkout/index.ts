import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_PRICE_MAP: Record<string, Record<string, string>> = {
  starter: {
    monthly: Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY') ?? '',
    annual:  Deno.env.get('STRIPE_PRICE_STARTER_ANNUAL')  ?? '',
  },
  growth: {
    monthly: Deno.env.get('STRIPE_PRICE_GROWTH_MONTHLY') ?? '',
    annual:  Deno.env.get('STRIPE_PRICE_GROWTH_ANNUAL')  ?? '',
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { plan, annual = false, workspaceId, successUrl, cancelUrl } = await req.json();

    if (!plan || !workspaceId) throw new Error('plan and workspaceId are required');
    if (!PLAN_PRICE_MAP[plan]) throw new Error(`No pricing configured for plan: ${plan}`);

    const priceId = annual ? PLAN_PRICE_MAP[plan].annual : PLAN_PRICE_MAP[plan].monthly;
    if (!priceId) throw new Error(`Stripe price ID not configured for plan: ${plan} (${annual ? 'annual' : 'monthly'})`);

    // Fetch workspace for existing customer ID
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select('id, name, stripe_customer_id, stripe_subscription_id')
      .eq('id', workspaceId)
      .single();
    if (wsError || !workspace) throw new Error('Workspace not found');

    // Fetch user email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, company_name')
      .eq('id', user.id)
      .single();

    // Get or create Stripe customer
    let customerId = workspace.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email,
        name: workspace.name,
        metadata: { workspace_id: workspaceId },
      });
      customerId = customer.id;

      // Store customer ID immediately
      await supabaseAdmin
        .from('workspaces')
        .update({ stripe_customer_id: customerId })
        .eq('id', workspaceId);
    }

    // If already subscribed, use billing portal instead of a new checkout
    if (workspace.stripe_subscription_id) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: cancelUrl ?? `${req.headers.get('origin')}/control-centre/settings`,
      });
      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${req.headers.get('origin')}/control-centre/settings?stripe=success`,
      cancel_url: cancelUrl ?? `${req.headers.get('origin')}/pricing`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { workspace_id: workspaceId, plan },
      },
      metadata: { workspace_id: workspaceId, plan },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
