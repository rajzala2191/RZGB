import { supabase } from '@/lib/customSupabaseClient';

// This app currently models "projects" through order entities.
// Keeping this adapter lets future UI redesigns introduce a real projects table
// without changing feature components.
export const fetchProjectsForClient = async (clientId) =>
  supabase
    .from('orders')
    .select('id, part_name, order_status, created_at, updated_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
