import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

// Map Stripe price IDs → plan names
const PRICE_TO_PLAN: Record<string, string> = {
  [Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY') ?? '__none__']: 'starter',
  [Deno.env.get('STRIPE_PRICE_STARTER_ANNUAL')  ?? '__none__']: 'starter',
  [Deno.env.get('STRIPE_PRICE_GROWTH_MONTHLY')  ?? '__none__']: 'growth',
  [Deno.env.get('STRIPE_PRICE_GROWTH_ANNUAL')   ?? '__none__']: 'growth',
};

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2024-06-20',
  });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Verify Stripe webhook signature
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Checkout completed → subscription is live ──────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const workspaceId = session.metadata?.workspace_id;
        const plan = session.metadata?.plan;
        const subscriptionId = session.subscription as string;

        if (!workspaceId) {
          console.error('checkout.session.completed: missing workspace_id in metadata');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const resolvedPlan = plan ?? PRICE_TO_PLAN[priceId] ?? 'starter';

        await supabaseAdmin
          .from('workspaces')
          .update({
            plan: resolvedPlan,
            plan_status: 'active',
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            stripe_subscription_status: subscription.status,
            plan_upgraded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', workspaceId);

        // Log the upgrade
        await supabaseAdmin.from('subscription_events').insert({
          workspace_id: workspaceId,
          from_plan: 'free',
          to_plan: resolvedPlan,
          note: `Stripe checkout completed (${subscriptionId})`,
        });

        break;
      }

      // ── Subscription updated (plan change, renewal, status change) ─────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId = subscription.metadata?.workspace_id;

        if (!workspaceId) {
          // Fallback: look up by customer ID
          const { data: ws } = await supabaseAdmin
            .from('workspaces')
            .select('id, plan')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle();
          if (!ws) break;

          const priceId = subscription.items.data[0]?.price.id;
          const plan = PRICE_TO_PLAN[priceId] ?? ws.plan;

          const planStatus = subscription.status === 'active' ? 'active'
            : subscription.status === 'past_due' ? 'expired'
            : subscription.status === 'canceled' ? 'cancelled'
            : subscription.status;

          await supabaseAdmin
            .from('workspaces')
            .update({
              plan,
              plan_status: planStatus,
              stripe_price_id: priceId,
              stripe_subscription_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', ws.id);
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN[priceId] ?? 'starter';

        const planStatus = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'expired'
          : subscription.status === 'canceled' ? 'cancelled'
          : subscription.status;

        await supabaseAdmin
          .from('workspaces')
          .update({
            plan,
            plan_status: planStatus,
            stripe_price_id: priceId,
            stripe_subscription_status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workspaceId);

        break;
      }

      // ── Subscription cancelled → downgrade to free ─────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: ws } = await supabaseAdmin
          .from('workspaces')
          .select('id, plan')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        if (!ws) break;

        await supabaseAdmin
          .from('workspaces')
          .update({
            plan: 'free',
            plan_status: 'cancelled',
            stripe_subscription_id: null,
            stripe_price_id: null,
            stripe_subscription_status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', ws.id);

        await supabaseAdmin.from('subscription_events').insert({
          workspace_id: ws.id,
          from_plan: ws.plan,
          to_plan: 'free',
          note: `Stripe subscription cancelled (${subscription.id})`,
        });

        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        await supabaseAdmin
          .from('workspaces')
          .update({
            plan_status: 'expired',
            stripe_subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
