import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Fetch workspace plan info (plan, status, expires_at).
 * Uses the regular supabase client so RLS applies.
 */
export const fetchWorkspacePlan = async (workspaceId) =>
  supabase
    .from('workspaces')
    .select('id, name, plan, plan_status, plan_expires_at, plan_upgraded_at')
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
