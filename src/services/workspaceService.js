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
