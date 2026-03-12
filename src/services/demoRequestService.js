import { supabase } from '@/lib/customSupabaseClient';

/** sessionStorage key for the approved demo token (so refresh keeps access in same tab) */
export const DEMO_ACCESS_KEY = 'rzgb-demo-access-token';

/**
 * Submit a demo access request (public). RLS allows insert with status = 'pending'.
 */
export async function submitDemoRequest(email) {
  const { data, error } = await supabase
    .from('demo_requests')
    .insert({ email: email.trim().toLowerCase(), status: 'pending' })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Check if a token grants demo access. Callable by anon/authenticated.
 */
export async function checkDemoToken(token) {
  if (!token || typeof token !== 'string') return false;
  const { data, error } = await supabase.rpc('check_demo_token', { p_token: token.trim() });
  if (error) return false;
  return data === true;
}

/**
 * List all demo requests (super_admin only). Uses authenticated Supabase client.
 */
export async function fetchDemoRequests() {
  const { data, error } = await supabase
    .from('demo_requests')
    .select('id, email, status, requested_at, approved_at, approved_by, created_at, updated_at')
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return data;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const getFunctionsUrl = () => `${SUPABASE_URL}/functions/v1`;

/**
 * Approve a demo request. Calls Edge Function which updates DB and sends email.
 * Requires authenticated user with role super_admin.
 */
export async function approveDemoRequest(requestId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  const res = await fetch(`${getFunctionsUrl()}/approve-demo-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ request_id: requestId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || body.message || 'Failed to approve');
  return body;
}

/**
 * Reject a demo request (super_admin only). Direct update.
 */
export async function rejectDemoRequest(requestId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('demo_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);
  if (error) throw error;
}
