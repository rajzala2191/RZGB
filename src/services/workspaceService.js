import { supabaseAdmin } from '@/lib/supabaseAdmin';

const now = () => new Date().toISOString();

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const createWorkspace = async ({ name, settings }) => {
  const slug = slugify(name) + '-' + Math.floor(1000 + Math.random() * 9000);
  return supabaseAdmin
    .from('workspaces')
    .insert([{ name, slug, status: 'active', settings: settings || {} }])
    .select()
    .single();
};

/**
 * Call the signup RPC with the user's Supabase client (bypasses RLS via SECURITY DEFINER).
 * Use this from the frontend when the service role key is not available so workspace insert does not hit RLS.
 */
export const createSignupWorkspaceAndProfileRpc = async (userSupabase, {
  userId,
  email,
  fullName,
  businessName,
  phone,
  website,
}) => {
  const { data, error } = await userSupabase.rpc('create_signup_workspace_and_profile', {
    p_user_id: userId,
    p_email: email,
    p_full_name: fullName,
    p_business_name: businessName || '',
    p_phone: phone || null,
    p_website: website || null,
  });
  if (error) return { data: null, error };
  const workspaceId = data?.workspace_id ?? null;
  return { data: workspaceId ? { workspaceId } : null, error: null };
};

export const fetchAllWorkspaces = async () =>
  supabaseAdmin
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });

export const fetchWorkspaceById = async (workspaceId) =>
  supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .maybeSingle();

export const updateWorkspaceStatus = async (workspaceId, status) =>
  supabaseAdmin
    .from('workspaces')
    .update({ status, updated_at: now() })
    .eq('id', workspaceId);

export const updateWorkspace = async (workspaceId, updates) =>
  supabaseAdmin
    .from('workspaces')
    .update({ ...updates, updated_at: now() })
    .eq('id', workspaceId);

export const fetchWorkspaceUsers = async (workspaceId) =>
  supabaseAdmin
    .from('profiles')
    .select('id, email, role, company_name, admin_scope, status, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

export const fetchWorkspaceStats = async (workspaceId) => {
  const [users, orders, pos, invoices] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabaseAdmin.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabaseAdmin.from('invoices').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
  ]);
  return {
    users: users.count || 0,
    orders: orders.count || 0,
    purchaseOrders: pos.count || 0,
    invoices: invoices.count || 0,
  };
};

export const fetchAllPlatformStats = async () => {
  const [workspaces, users, orders] = await Promise.all([
    supabaseAdmin.from('workspaces').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
  ]);
  return {
    workspaces: workspaces.count || 0,
    users: users.count || 0,
    orders: orders.count || 0,
  };
};

export const assignUserToWorkspace = async (userId, workspaceId) =>
  supabaseAdmin
    .from('profiles')
    .update({ workspace_id: workspaceId })
    .eq('id', userId);

export const setUserAdminScope = async (userId, scope) =>
  supabaseAdmin
    .from('profiles')
    .update({ admin_scope: scope })
    .eq('id', userId);

/**
 * Provision a workspace + admin profile for a self-signup user.
 * Prefers RPC with user's client (works when service role key is not in browser); falls back to supabaseAdmin.
 */
export const createSignupWorkspaceAndProfile = async (params, userSupabase = null) => {
  if (userSupabase) {
    return createSignupWorkspaceAndProfileRpc(userSupabase, params);
  }
  // Service-role path (bypasses RLS)
  const { userId, email, fullName, businessName, phone, website } = params;
  const wsSlug = slugify(businessName) + '-' + Math.floor(1000 + Math.random() * 9000);
  const { data: ws, error: wsErr } = await supabaseAdmin
    .from('workspaces')
    .insert([{
      name: businessName,
      slug: wsSlug,
      status: 'pending',
      plan: 'free',
      plan_status: 'active',
      settings: {},
      onboarding_data: {},
    }])
    .select()
    .single();

  if (wsErr) return { data: null, error: wsErr };

  const { error: profErr } = await supabaseAdmin
    .from('profiles')
    .insert([{
      id: userId,
      email,
      company_name: businessName,
      role: 'admin',
      admin_scope: 'workspace',
      workspace_id: ws.id,
      status: 'active',
      is_demo: false,
      phone: phone || null,
      website: website || null,
      onboarding_status: 'not_started',
    }]);

  if (profErr) {
    await supabaseAdmin.from('workspaces').delete().eq('id', ws.id);
    return { data: null, error: profErr };
  }

  return { data: { workspaceId: ws.id }, error: null };
};

// ── Onboarding wizard ──────────────────────────────────────────────────────

export const saveOnboardingData = async (workspaceId, data) =>
  supabaseAdmin
    .from('workspaces')
    .update({ onboarding_data: data, onboarding_completed_at: new Date().toISOString() })
    .eq('id', workspaceId);

export const completeOnboarding = async (userId) =>
  supabaseAdmin
    .from('profiles')
    .update({ onboarding_status: 'completed' })
    .eq('id', userId);

// ── Joinlist (platform admin) ─────────────────────────────────────────────

export const fetchPendingWorkspaces = async () =>
  supabaseAdmin
    .from('workspaces')
    .select('*, profiles!workspace_id(id, email, company_name, created_at)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

export const fetchResolvedJoinlistWorkspaces = async () =>
  supabaseAdmin
    .from('workspaces')
    .select('*, profiles!workspace_id(id, email, company_name)')
    .in('status', ['active', 'archived'])
    .neq('onboarding_data', '{}')
    .order('updated_at', { ascending: false })
    .limit(50);

export const approveWorkspace = async (workspaceId, adminId) =>
  supabaseAdmin.rpc('approve_workspace_joinlist', {
    p_workspace_id: workspaceId,
    p_admin_id: adminId,
  });

export const rejectWorkspace = async (workspaceId, adminId) =>
  supabaseAdmin.rpc('reject_workspace_joinlist', {
    p_workspace_id: workspaceId,
    p_admin_id: adminId,
  });
