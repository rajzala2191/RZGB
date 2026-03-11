import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const buildUpdatedAt = () => new Date().toISOString();

export const fetchClientOrders = async (clientId) =>
  supabase
    .from('orders')
    .select('*')
    .eq('client_id', clientId)
    .neq('order_status', 'CLEARED')
    .order('created_at', { ascending: false });

export const fetchClientDocumentsByClientId = async (clientId) =>
  supabase
    .from('documents')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

export const fetchDocumentsByOrderIds = async (orderIds) =>
  supabase
    .from('documents')
    .select('*')
    .in('order_id', orderIds)
    .order('created_at', { ascending: false });

export const withdrawOrderById = async (orderId) =>
  supabase
    .from('orders')
    .update({ order_status: 'WITHDRAWN', updated_at: buildUpdatedAt() })
    .eq('id', orderId);

export const clearWithdrawnOrderById = async (orderId) =>
  supabase
    .from('orders')
    .update({ order_status: 'CLEARED', updated_at: buildUpdatedAt() })
    .eq('id', orderId);

export const clearWithdrawnOrders = async (orderIds) => {
  const results = await Promise.allSettled(orderIds.map(clearWithdrawnOrderById));
  return results.reduce((count, result) => {
    if (result.status === 'fulfilled' && !result.value?.error) {
      return count + 1;
    }
    return count;
  }, 0);
};

export const fetchOrderById = async (orderId) =>
  supabase.from('orders').select('*').eq('id', orderId).maybeSingle();

export const fetchJobUpdatesByRzJobId = async (rzJobId) =>
  supabase
    .from('job_updates')
    .select('*')
    .eq('rz_job_id', rzJobId)
    .order('created_at', { ascending: true });

export const fetchOrderDocumentsByOrderId = async (orderId) =>
  supabaseAdmin
    .from('documents')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

export const fetchActiveManufacturingProcesses = async () =>
  supabase
    .from('manufacturing_processes')
    .select('id, name, status_key, description')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

export const createOrder = async (payload) =>
  supabase.from('orders').insert([payload]).select().single();

export const uploadDocumentToStorage = async ({ path, file }) =>
  supabaseAdmin.storage.from('documents').upload(path, file);

export const createOrderDocumentRecord = async (payload) =>
  supabaseAdmin.from('documents').insert([payload]);
