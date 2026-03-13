import { supabase } from '@/lib/customSupabaseClient';

/** sessionStorage key for the approved demo token (so refresh keeps access in same tab) */
export const DEMO_ACCESS_KEY = 'rzgb-demo-access-token';

/**
 * Submit a demo access request (public). Uses RPC so insert is not blocked by RLS.
 */
export async function submitDemoRequest(email) {
  const { data, error } = await supabase.rpc('submit_demo_request', {
    p_email: email.trim().toLowerCase(),
  });
  if (error) throw error;
  return { id: data };
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
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const getFunctionsUrl = () => {
  if (!SUPABASE_URL) throw new Error('Supabase URL not configured. Set VITE_SUPABASE_URL in .env.');
  return `${SUPABASE_URL}/functions/v1`;
};

/**
 * Approve a demo request. Calls Edge Function which updates DB and sends email.
 * Requires authenticated user with role super_admin.
 */
export async function approveDemoRequest(requestId) {
  const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
  if (sessionError || !session?.access_token) throw new Error('Not authenticated');
  const url = `${getFunctionsUrl()}/approve-demo-request`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...(SUPABASE_ANON_KEY && { 'apikey': SUPABASE_ANON_KEY }),
    },
    body: JSON.stringify({ request_id: requestId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || body.message || 'Failed to approve');
  return body;
}

/** Human-readable hint when approve/reject fails with a network error */
export function getNetworkErrorHint(fetchErrorMessage) {
  if (!fetchErrorMessage || typeof fetchErrorMessage !== 'string') return null;
  const lower = fetchErrorMessage.toLowerCase();
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('load')) {
    return 'Network error. Check that VITE_SUPABASE_URL is set, the approve-demo-request Edge Function is deployed, and your connection is stable.';
  }
  return null;
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
