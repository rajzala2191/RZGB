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

// ─── Process Templates ────────────────────────────────────────────────────────

export const fetchProcessTemplates = async () =>
  supabaseAdmin
    .from('process_templates')
    .select('*')
    .order('created_at', { ascending: true });

export const createProcessTemplate = async (payload) =>
  supabaseAdmin.from('process_templates').insert([payload]).select().single();

export const updateProcessTemplate = async (id, payload) =>
  supabaseAdmin.from('process_templates').update(payload).eq('id', id);

export const deleteProcessTemplate = async (id) =>
  supabaseAdmin.from('process_templates').delete().eq('id', id);

// ─── Per-Order Process Override ───────────────────────────────────────────────

export const updateOrderProcesses = async (orderId, processKeys) => {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ selected_processes: processKeys, updated_at: buildUpdatedAt() })
    .eq('id', orderId);
  return { error };
};

// ─── Sub-Steps ────────────────────────────────────────────────────────────────

export const fetchSubStepsForProcess = async (processId) =>
  supabaseAdmin
    .from('process_sub_steps')
    .select('*')
    .eq('process_id', processId)
    .order('display_order', { ascending: true });

export const fetchSubStepsForProcesses = async (processIds) =>
  supabaseAdmin
    .from('process_sub_steps')
    .select('*')
    .in('process_id', processIds)
    .order('display_order', { ascending: true });

export const createSubStep = async (payload) =>
  supabaseAdmin.from('process_sub_steps').insert([payload]).select().single();

export const updateSubStep = async (id, payload) =>
  supabaseAdmin.from('process_sub_steps').update(payload).eq('id', id);

export const deleteSubStep = async (id) =>
  supabaseAdmin.from('process_sub_steps').delete().eq('id', id);

// ─── Order Step Progress ──────────────────────────────────────────────────────

export const fetchOrderStepProgress = async (orderId) =>
  supabase
    .from('order_step_progress')
    .select('*')
    .eq('order_id', orderId);

export const updateStepProgress = async (orderId, subStepId, { status, notes, evidenceUrl }) => {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = {
    order_id: orderId,
    sub_step_id: subStepId,
    status,
    notes: notes ?? null,
    evidence_url: evidenceUrl ?? null,
    completed_by: status === 'completed' ? user?.id : null,
    completed_at: status === 'completed' ? buildUpdatedAt() : null,
  };
  return supabase
    .from('order_step_progress')
    .upsert(payload, { onConflict: 'order_id,sub_step_id' })
    .select()
    .single();
};

// selectedProcesses: array of { id: UUID, status_key: string }
export const generateOrderStepProgress = async (orderId, selectedProcesses) => {
  if (!selectedProcesses?.length) return;
  const processIds = selectedProcesses.map((p) => p.id);
  const { data: subSteps, error } = await supabaseAdmin
    .from('process_sub_steps')
    .select('id, process_id')
    .in('process_id', processIds);
  if (error || !subSteps?.length) return;
  const processKeyMap = Object.fromEntries(selectedProcesses.map((p) => [p.id, p.status_key]));
  const rows = subSteps.map((s) => ({
    order_id: orderId,
    sub_step_id: s.id,
    process_key: processKeyMap[s.process_id] ?? '',
    status: 'pending',
  }));
  return supabaseAdmin
    .from('order_step_progress')
    .insert(rows)
    .select();
};
