import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const now = () => new Date().toISOString();

const generateContractNumber = () => {
  const year = new Date().getFullYear();
  const seq = Math.floor(10000 + Math.random() * 90000);
  return `CTR-${year}-${seq}`;
};

// ── Valid lifecycle transitions ───────────────────────────────────────────────
const ALLOWED_TRANSITIONS = {
  draft:       ['active', 'terminated'],
  active:      ['expired', 'terminated', 'renewed'],
  expired:     ['renewed'],
  terminated:  [],
  renewed:     [],
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

export const createContract = async ({
  title, description, contractType, supplierId, clientId, orderId,
  totalValue, currency, startDate, endDate, renewalNoticeDays, autoRenew,
  terms, notes, filePath, createdBy,
}) => {
  const contractNumber = generateContractNumber();
  const { data: contract, error } = await supabaseAdmin
    .from('contracts')
    .insert([{
      contract_number: contractNumber,
      title,
      description,
      contract_type: contractType || 'supply_agreement',
      supplier_id: supplierId || null,
      client_id: clientId || null,
      order_id: orderId || null,
      total_value: totalValue ? parseFloat(totalValue) : null,
      currency: currency || 'GBP',
      start_date: startDate || null,
      end_date: endDate || null,
      renewal_notice_days: renewalNoticeDays ?? 30,
      auto_renew: autoRenew ?? false,
      terms: terms || [],
      notes,
      file_path: filePath || null,
      created_by: createdBy,
    }])
    .select()
    .single();

  if (error) throw error;

  await supabaseAdmin.from('contract_events').insert({
    contract_id: contract.id,
    event_type: 'created',
    to_status: 'draft',
    performed_by: createdBy,
  });

  return { data: contract };
};

export const fetchAllContracts = async () =>
  supabaseAdmin
    .from('contracts')
    .select('*, supplier:supplier_id(id, company_name, email), client:client_id(id, company_name, email), order:order_id(id, rz_job_id, part_name)')
    .order('created_at', { ascending: false });

export const fetchContractById = async (contractId) =>
  supabaseAdmin
    .from('contracts')
    .select('*, supplier:supplier_id(id, company_name, email), client:client_id(id, company_name, email), order:order_id(id, rz_job_id, part_name), events:contract_events(*, performer:performed_by(company_name, email))')
    .eq('id', contractId)
    .maybeSingle();

export const fetchContractsForSupplier = async (supplierId) =>
  supabase
    .from('contracts')
    .select('*, order:order_id(id, rz_job_id, part_name)')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

export const fetchContractsExpiringSoon = async (days = 60) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return supabaseAdmin
    .from('contracts')
    .select('*, supplier:supplier_id(id, company_name, email)')
    .eq('status', 'active')
    .lte('end_date', cutoff.toISOString().split('T')[0])
    .gte('end_date', new Date().toISOString().split('T')[0])
    .order('end_date', { ascending: true });
};

export const updateContract = async (contractId, updates) => {
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('contracts')
    .select('status')
    .eq('id', contractId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!existing) throw new Error('Contract not found');
  if (existing.status !== 'draft') throw new Error('Only draft contracts can be edited');

  return supabaseAdmin
    .from('contracts')
    .update({ ...updates, updated_at: now() })
    .eq('id', contractId);
};

// ── Lifecycle transitions ─────────────────────────────────────────────────────

export const transitionContractStatus = async (contractId, toStatus, performedBy, notes) => {
  const { data: contract, error: fetchErr } = await supabaseAdmin
    .from('contracts')
    .select('status')
    .eq('id', contractId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!contract) throw new Error('Contract not found');

  const allowed = ALLOWED_TRANSITIONS[contract.status] || [];
  if (!allowed.includes(toStatus)) {
    throw new Error(`Cannot transition contract from '${contract.status}' to '${toStatus}'`);
  }

  const update = { status: toStatus, updated_at: now() };
  if (toStatus === 'active' && !contract.signed_at) update.signed_at = now();
  if (toStatus === 'active' && performedBy) update.signed_by = performedBy;

  const { error: updateErr } = await supabaseAdmin
    .from('contracts')
    .update(update)
    .eq('id', contractId);
  if (updateErr) throw updateErr;

  await supabaseAdmin.from('contract_events').insert({
    contract_id: contractId,
    event_type: toStatus,
    from_status: contract.status,
    to_status: toStatus,
    performed_by: performedBy,
    notes,
  });

  return { success: true };
};

// ── Renew: creates a new draft contract as a successor ────────────────────────

export const renewContract = async (contractId, { newEndDate, performedBy }) => {
  const { data: source, error: fetchErr } = await supabaseAdmin
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!source) throw new Error('Contract not found');
  if (!['active', 'expired'].includes(source.status)) {
    throw new Error('Only active or expired contracts can be renewed');
  }

  const newNumber = generateContractNumber();
  const { data: newContract, error: insertErr } = await supabaseAdmin
    .from('contracts')
    .insert([{
      contract_number: newNumber,
      title: `${source.title} (Renewal)`,
      description: source.description,
      contract_type: source.contract_type,
      supplier_id: source.supplier_id,
      client_id: source.client_id,
      order_id: source.order_id,
      total_value: source.total_value,
      currency: source.currency,
      start_date: source.end_date,
      end_date: newEndDate || null,
      renewal_notice_days: source.renewal_notice_days,
      auto_renew: source.auto_renew,
      terms: source.terms,
      renewed_from_id: contractId,
      created_by: performedBy,
    }])
    .select()
    .single();
  if (insertErr) throw insertErr;

  await transitionContractStatus(contractId, 'renewed', performedBy, `Renewed as ${newNumber}`);

  await supabaseAdmin.from('contract_events').insert({
    contract_id: newContract.id,
    event_type: 'created',
    to_status: 'draft',
    performed_by: performedBy,
    notes: `Renewal of ${source.contract_number}`,
  });

  return { data: newContract };
};
