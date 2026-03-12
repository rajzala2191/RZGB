import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { dispatchWebhookEvent } from '@/services/webhookService';

const now = () => new Date().toISOString();

const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const seq = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}-${seq}`;
};

export const createInvoice = async ({
  orderId, poId, supplierId, clientId, amount, currency, taxAmount,
  lineItems, dueDate, notes, filePath,
}) => {
  const invoiceNumber = generateInvoiceNumber();
  const totalAmount = (parseFloat(amount) || 0) + (parseFloat(taxAmount) || 0);
  return supabase
    .from('invoices')
    .insert([{
      invoice_number: invoiceNumber,
      order_id: orderId || null,
      po_id: poId || null,
      supplier_id: supplierId,
      client_id: clientId || null,
      amount: parseFloat(amount),
      currency: currency || 'GBP',
      tax_amount: parseFloat(taxAmount) || 0,
      total_amount: totalAmount,
      line_items: lineItems || [],
      due_date: dueDate || null,
      notes,
      file_path: filePath || null,
      invoice_status: 'submitted',
    }])
    .select()
    .single();
};

export const fetchSupplierInvoices = async (supplierId) =>
  supabase
    .from('invoices')
    .select('*, order:order_id(rz_job_id, part_name, ghost_public_name), po:po_id(po_number)')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

export const fetchAllInvoices = async () =>
  supabaseAdmin
    .from('invoices')
    .select('*, supplier:supplier_id(id, company_name, email), order:order_id(rz_job_id, part_name, ghost_public_name), po:po_id(po_number)')
    .order('created_at', { ascending: false });

export const fetchInvoiceById = async (invoiceId) =>
  supabaseAdmin
    .from('invoices')
    .select('*, supplier:supplier_id(id, company_name, email), order:order_id(*), po:po_id(*)')
    .eq('id', invoiceId)
    .maybeSingle();

export const updateInvoiceStatus = async (invoiceId, status, reviewedBy) => {
  if (status === 'paid') {
    const { data: inv, error: invErr } = await supabaseAdmin
      .from('invoices')
      .select('invoice_status, total_amount, po_id')
      .eq('id', invoiceId)
      .maybeSingle();
    if (invErr) throw invErr;
    if (!inv || inv.invoice_status !== 'approved') {
      throw new Error('Invoice must be approved before marking as paid');
    }
    if (inv.po_id) {
      const { data: po, error: poErr } = await supabaseAdmin
        .from('purchase_orders')
        .select('total_amount')
        .eq('id', inv.po_id)
        .maybeSingle();
      if (!poErr && po) {
        const invoiceAmt = parseFloat(inv.total_amount);
        const poAmt = parseFloat(po.total_amount);
        if (Math.abs(invoiceAmt - poAmt) > poAmt * 0.05) {
          throw new Error(
            `3-way match failed: invoice total (${invoiceAmt}) differs from PO total (${poAmt}) by more than 5%`
          );
        }
      }
    }
  }

  const update = { invoice_status: status, updated_at: now() };
  if (reviewedBy) {
    update.reviewed_by = reviewedBy;
    update.reviewed_at = now();
  }
  if (status === 'paid') update.paid_date = new Date().toISOString().split('T')[0];
  const result = await supabaseAdmin.from('invoices').update(update).eq('id', invoiceId);

  if (status === 'approved' || status === 'paid') {
    dispatchWebhookEvent(`invoice.${status}`, { invoiceId, status, reviewedBy }).catch(() => {});
  }

  return result;
};

export const fetchOverdueInvoices = async () =>
  supabaseAdmin
    .from('invoices')
    .select('*, supplier:supplier_id(id, company_name, email), order:order_id(rz_job_id, part_name)')
    .in('invoice_status', ['submitted', 'approved'])
    .lt('due_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true });

export const fetchInvoiceStats = async () => {
  const { data: all } = await supabaseAdmin.from('invoices').select('invoice_status, total_amount, currency');
  if (!all) return { total: 0, submitted: 0, approved: 0, paid: 0, overdue: 0, totalValue: 0, paidValue: 0 };

  const stats = { total: all.length, submitted: 0, approved: 0, paid: 0, overdue: 0, totalValue: 0, paidValue: 0 };
  all.forEach(inv => {
    stats[inv.invoice_status] = (stats[inv.invoice_status] || 0) + 1;
    stats.totalValue += parseFloat(inv.total_amount) || 0;
    if (inv.invoice_status === 'paid') stats.paidValue += parseFloat(inv.total_amount) || 0;
  });
  return stats;
};

export const createPaymentMilestone = async ({ orderId, poId, milestoneType, description, amount, currency, percentage, dueDate }) =>
  supabaseAdmin
    .from('payment_milestones')
    .insert([{ order_id: orderId, po_id: poId, milestone_type: milestoneType, description, amount, currency: currency || 'GBP', percentage, due_date: dueDate }])
    .select()
    .single();

export const fetchMilestonesForOrder = async (orderId) =>
  supabaseAdmin
    .from('payment_milestones')
    .select('*, invoice:invoice_id(invoice_number, invoice_status)')
    .eq('order_id', orderId)
    .order('due_date', { ascending: true });

export const createCreditNote = async ({ invoiceId, amount, reason, createdBy }) => {
  const year = new Date().getFullYear();
  const creditNumber = `CN-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  return supabaseAdmin
    .from('credit_notes')
    .insert([{ invoice_id: invoiceId, credit_number: creditNumber, amount, reason, created_by: createdBy }])
    .select()
    .single();
};
