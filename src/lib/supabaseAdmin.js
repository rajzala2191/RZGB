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

const supabaseUrl = 'https://arolzvuvrabpdakgwyjl.supabase.co';
const supabaseServiceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyb2x6dnV2cmFicGRha2d3eWpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDczNzU0NiwiZXhwIjoyMDg2MzEzNTQ2fQ.CXSOEnWkak80DN3PulE506tCotqJqlW78sWTNPwM5Y4';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
