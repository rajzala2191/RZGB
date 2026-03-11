/**
 * Supabase Admin Client — uses the service_role key to bypass RLS.
 *
 * ⚠️  SECURITY NOTE: The service_role key is included here because this is a
 *     prototype / internal-tool SPA. In production, privileged operations
 *     (supplier stage updates, etc.) should be performed by a backend API or
 *     a Supabase Edge Function — never from the browser.
 *
 * This client is used ONLY for specific operations where the normal RLS
 * policies block legitimate actions (e.g. suppliers updating order status).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Fall back to the anon key if service role key is not configured.
// Operations that require elevated privileges will be rejected by RLS,
// but the app will not crash on startup.
const effectiveKey = supabaseServiceRoleKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseAdmin = createClient(supabaseUrl, effectiveKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    storageKey: 'rzgb-admin-auth',
  },
});
