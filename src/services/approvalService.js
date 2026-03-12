import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const now = () => new Date().toISOString();

export const createWorkflow = async ({ name, entityType, steps, createdBy }) => {
  const { data: workflow, error: wfErr } = await supabaseAdmin
    .from('approval_workflows')
    .insert([{ name, entity_type: entityType, created_by: createdBy }])
    .select()
    .single();

  if (wfErr) throw wfErr;

  if (steps?.length) {
    const stepRows = steps.map((s, i) => ({
      workflow_id: workflow.id,
      step_order: i + 1,
      approver_role: s.approverRole,
      approver_id: s.approverId || null,
      threshold_amount: s.thresholdAmount || null,
      threshold_currency: s.thresholdCurrency || 'GBP',
      auto_approve: s.autoApprove || false,
      escalation_hours: s.escalationHours || 48,
    }));
    const { error: stErr } = await supabaseAdmin.from('approval_steps').insert(stepRows);
    if (stErr) throw stErr;
  }

  return workflow;
};

export const fetchWorkflows = async () =>
  supabaseAdmin
    .from('approval_workflows')
    .select('*, steps:approval_steps(*)' )
    .eq('is_active', true)
    .order('created_at', { ascending: false });

export const fetchWorkflowById = async (workflowId) =>
  supabaseAdmin
    .from('approval_workflows')
    .select('*, steps:approval_steps(*)')
    .eq('id', workflowId)
    .maybeSingle();

export const deleteWorkflow = async (workflowId) =>
  supabaseAdmin.from('approval_workflows').update({ is_active: false, updated_at: now() }).eq('id', workflowId);

export const submitForApproval = async ({ workflowId, entityType, entityId, requestedBy }) =>
  supabaseAdmin
    .from('approval_requests')
    .insert([{ workflow_id: workflowId, entity_type: entityType, entity_id: entityId, current_step: 1, status: 'pending', requested_by: requestedBy }])
    .select()
    .single();

export const fetchApprovalRequests = async (status) => {
  let query = supabaseAdmin
    .from('approval_requests')
    .select('*, workflow:workflow_id(name, entity_type), requester:requested_by(company_name, email)')
    .order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  return query;
};

export const fetchMyPendingApprovals = async (userId) => {
  const { data: steps } = await supabaseAdmin
    .from('approval_steps')
    .select('workflow_id, step_order')
    .eq('approver_id', userId);

  if (!steps?.length) return { data: [] };

  const { data: requests } = await supabaseAdmin
    .from('approval_requests')
    .select('*, workflow:workflow_id(name, entity_type)')
    .eq('status', 'pending');

  const pending = (requests || []).filter(r =>
    steps.some(s => s.workflow_id === r.workflow_id && s.step_order === r.current_step)
  );

  return { data: pending };
};

export const makeDecision = async ({ requestId, stepOrder, decidedBy, decision, comments, delegatedTo }) => {
  const { data: request, error: reqErr } = await supabaseAdmin
    .from('approval_requests')
    .select('workflow_id, current_step, status')
    .eq('id', requestId)
    .maybeSingle();
  if (reqErr) throw reqErr;
  if (!request) throw new Error('Approval request not found');
  if (request.status === 'approved' || request.status === 'rejected') {
    throw new Error(`Approval request is already ${request.status}`);
  }
  if (request.current_step !== stepOrder) {
    throw new Error(`Cannot act on step ${stepOrder}; current step is ${request.current_step}`);
  }

  const { data: step, error: stepErr } = await supabaseAdmin
    .from('approval_steps')
    .select('approver_id')
    .eq('workflow_id', request.workflow_id)
    .eq('step_order', stepOrder)
    .maybeSingle();
  if (stepErr) throw stepErr;
  if (step?.approver_id && step.approver_id !== decidedBy) {
    throw new Error('User is not the authorized approver for this step');
  }

  const { error: decErr } = await supabaseAdmin
    .from('approval_decisions')
    .insert([{ request_id: requestId, step_order: stepOrder, decided_by: decidedBy, decision, comments, delegated_to: delegatedTo || null }]);

  if (decErr) throw decErr;

  if (decision === 'rejected') {
    await supabaseAdmin.from('approval_requests').update({ status: 'rejected', updated_at: now() }).eq('id', requestId);
  } else if (decision === 'approved') {
    const { data: request } = await supabaseAdmin.from('approval_requests').select('*, workflow:workflow_id(*)').eq('id', requestId).maybeSingle();
    const { data: steps } = await supabaseAdmin.from('approval_steps').select('*').eq('workflow_id', request.workflow_id).order('step_order', { ascending: true });
    const nextStep = steps?.find(s => s.step_order > stepOrder);

    if (nextStep) {
      await supabaseAdmin.from('approval_requests').update({ current_step: nextStep.step_order, status: 'in_progress', updated_at: now() }).eq('id', requestId);
    } else {
      await supabaseAdmin.from('approval_requests').update({ status: 'approved', updated_at: now() }).eq('id', requestId);
    }
  } else if (decision === 'delegated' && delegatedTo) {
    await supabaseAdmin.from('approval_steps').update({ approver_id: delegatedTo }).eq('workflow_id', (await supabaseAdmin.from('approval_requests').select('workflow_id').eq('id', requestId).maybeSingle()).data?.workflow_id).eq('step_order', stepOrder);
  }

  return { success: true };
};

export const fetchDecisionsForRequest = async (requestId) =>
  supabaseAdmin
    .from('approval_decisions')
    .select('*, decider:decided_by(company_name, email)')
    .eq('request_id', requestId)
    .order('decided_at', { ascending: true });
