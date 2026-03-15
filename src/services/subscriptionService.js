import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Call a Supabase Edge Function with the current user's JWT. */
async function callEdgeFunction(name, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Edge function ${name} failed`);
  return json;
}

/**
 * Start a Stripe Checkout session for a plan upgrade.
 * Returns { url } to redirect the browser to.
 */
export const createCheckoutSession = async ({ workspaceId, plan, annual = false }) => {
  try {
    const { url } = await callEdgeFunction('stripe-checkout', {
      workspaceId,
      plan,
      annual,
      successUrl: `${window.location.origin}/control-centre/settings?stripe=success`,
      cancelUrl: `${window.location.origin}/pricing`,
    });
    return { url, error: null };
  } catch (err) {
    return { url: null, error: err };
  }
};

/**
 * Open the Stripe Customer Portal for subscription management.
 * Returns { url } to redirect the browser to.
 */
export const createPortalSession = async ({ workspaceId }) => {
  try {
    const { url } = await callEdgeFunction('stripe-portal', {
      workspaceId,
      returnUrl: `${window.location.origin}/control-centre/settings`,
    });
    return { url, error: null };
  } catch (err) {
    return { url: null, error: err };
  }
};

/**
 * Fetch workspace plan info (plan, status, expires_at).
 * Uses the regular supabase client so RLS applies.
 */
export const fetchWorkspacePlan = async (workspaceId) =>
  supabase
    .from('workspaces')
    .select('id, name, plan, plan_status, plan_expires_at, plan_upgraded_at, stripe_customer_id, stripe_subscription_id, stripe_subscription_status')
    .eq('id', workspaceId)
    .single();

/**
 * Get current month order count via RPC.
 */
export const fetchMonthlyOrderCount = async (workspaceId) => {
  const { data, error } = await supabase.rpc('get_workspace_monthly_orders', {
    p_workspace_id: workspaceId,
  });
  if (error) return { data: 0, error };
  return { data: data ?? 0, error: null };
};

/**
 * Get active user count in a workspace.
 */
export const fetchWorkspaceUserCount = async (workspaceId) => {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .neq('status', 'inactive');
  return { data: count ?? 0, error };
};

/**
 * Increment monthly order counter (called after an order is created).
 */
export const incrementOrderUsage = async (workspaceId) =>
  supabase.rpc('increment_workspace_order_usage', {
    p_workspace_id: workspaceId,
  });

/**
 * Upgrade a workspace plan (super_admin only — uses admin client).
 */
export const upgradeWorkspacePlan = async ({ workspaceId, plan, changedBy, note }) => {
  const now = new Date().toISOString();

  // Fetch current plan for audit
  const { data: current } = await supabaseAdmin
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single();

  // Update workspace plan
  const { error: updateError } = await supabaseAdmin
    .from('workspaces')
    .update({
      plan,
      plan_status: 'active',
      plan_upgraded_at: now,
      plan_upgraded_by: changedBy ?? null,
      updated_at: now,
    })
    .eq('id', workspaceId);

  if (updateError) return { error: updateError };

  // Log the change
  await supabaseAdmin.from('subscription_events').insert({
    workspace_id: workspaceId,
    from_plan: current?.plan ?? null,
    to_plan: plan,
    changed_by: changedBy ?? null,
    note: note ?? null,
  });

  return { error: null };
};

/**
 * Fetch all subscription events for a workspace.
 */
export const fetchSubscriptionHistory = async (workspaceId) =>
  supabaseAdmin
    .from('subscription_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
