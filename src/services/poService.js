import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notifyPOIssued, notifyPOAcknowledged } from '@/services/slackService';
import { dispatchWebhookEvent } from '@/services/webhookService';

const now = () => new Date().toISOString();

const generatePONumber = () => {
  const year = new Date().getFullYear();
  const seq = Math.floor(10000 + Math.random() * 90000);
  return `PO-${year}-${seq}`;
};

export const createPurchaseOrder = async ({
  orderId, bidId, supplierId, lineItems, totalAmount, currency,
  paymentTerms, deliveryDate, notes, createdBy,
}) => {
  if (orderId) {
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('order_status')
      .eq('id', orderId)
      .maybeSingle();
    if (orderErr) throw orderErr;
    if (!order || order.order_status !== 'AWARDED') {
      throw new Error('Purchase orders can only be created for AWARDED orders');
    }
  }

  const poNumber = generatePONumber();
  return supabaseAdmin
    .from('purchase_orders')
    .insert([{
      order_id: orderId,
      bid_id: bidId || null,
      supplier_id: supplierId,
      po_number: poNumber,
      po_status: 'draft',
      line_items: lineItems || [],
      total_amount: totalAmount,
      currency: currency || 'GBP',
      payment_terms: paymentTerms,
      delivery_date: deliveryDate,
      notes,
      created_by: createdBy,
    }])
    .select()
    .single();
};

export const fetchAllPurchaseOrders = async () =>
  supabaseAdmin
    .from('purchase_orders')
    .select('*, order:order_id(id, rz_job_id, part_name, ghost_public_name, material, quantity), supplier:supplier_id(id, company_name, email)')
    .order('created_at', { ascending: false });

export const fetchPOById = async (poId) =>
  supabaseAdmin
    .from('purchase_orders')
    .select('*, order:order_id(*), supplier:supplier_id(id, company_name, email), bid:bid_id(*)')
    .eq('id', poId)
    .maybeSingle();

export const fetchPOsForSupplier = async (supplierId) =>
  supabase
    .from('purchase_orders')
    .select('*, order:order_id(id, rz_job_id, part_name, ghost_public_name, material, quantity)')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

export const issuePO = async (poId) => {
  const { data: po, error: poCheckErr } = await supabaseAdmin
    .from('purchase_orders')
    .select('po_status')
    .eq('id', poId)
    .maybeSingle();
  if (poCheckErr) throw poCheckErr;
  if (!po || po.po_status !== 'draft') {
    throw new Error('Purchase order is not in draft status');
  }

  const { data: pendingApproval } = await supabaseAdmin
    .from('approval_requests')
    .select('id')
    .eq('entity_type', 'purchase_order')
    .eq('entity_id', poId)
    .in('status', ['pending', 'in_progress'])
    .maybeSingle();
  if (pendingApproval) {
    throw new Error('Purchase order has a pending approval request that must be resolved first');
  }

  const result = await supabaseAdmin
    .from('purchase_orders')
    .update({ po_status: 'issued', issued_at: now(), updated_at: now() })
    .eq('id', poId);

  const { data: poDetail } = await supabaseAdmin
    .from('purchase_orders')
    .select('po_number, total_amount, currency, order:order_id(rz_job_id), supplier:supplier_id(company_name)')
    .eq('id', poId)
    .maybeSingle();

  if (poDetail) {
    notifyPOIssued({
      poNumber: poDetail.po_number,
      rzJobId: poDetail.order?.rz_job_id || '',
      supplierName: poDetail.supplier?.company_name || 'Supplier',
      totalAmount: poDetail.total_amount,
      currency: poDetail.currency,
    }).catch(() => {});

    dispatchWebhookEvent('po.issued', {
      poId,
      poNumber: poDetail.po_number,
      rzJobId: poDetail.order?.rz_job_id || '',
      supplierName: poDetail.supplier?.company_name,
      totalAmount: poDetail.total_amount,
      currency: poDetail.currency,
    }).catch(() => {});
  }

  return result;
};

export const acknowledgePO = async (poId, supplierId) => {
  const result = await supabase
    .from('purchase_orders')
    .update({ po_status: 'acknowledged', acknowledged_at: now(), acknowledged_by: supplierId, updated_at: now() })
    .eq('id', poId);

  const { data: po } = await supabaseAdmin
    .from('purchase_orders')
    .select('po_number, supplier:supplier_id(company_name)')
    .eq('id', poId)
    .maybeSingle();

  if (po) {
    notifyPOAcknowledged({
      poNumber: po.po_number,
      supplierName: po.supplier?.company_name || 'Supplier',
    }).catch(() => {});
  }

  return result;
};

export const createAmendment = async ({ poId, amendmentNumber, reason, changes, oldTotal, newTotal, createdBy }) =>
  supabaseAdmin
    .from('po_amendments')
    .insert([{
      po_id: poId,
      amendment_number: amendmentNumber,
      reason,
      changes,
      old_total: oldTotal,
      new_total: newTotal,
      created_by: createdBy,
    }])
    .select()
    .single();

export const fetchAmendments = async (poId) =>
  supabaseAdmin
    .from('po_amendments')
    .select('*')
    .eq('po_id', poId)
    .order('amendment_number', { ascending: true });

export const updatePOStatus = async (poId, status) =>
  supabaseAdmin
    .from('purchase_orders')
    .update({ po_status: status, updated_at: now() })
    .eq('id', poId);

export const fetchPOForOrder = async (orderId) =>
  supabaseAdmin
    .from('purchase_orders')
    .select('*, supplier:supplier_id(id, company_name, email)')
    .eq('order_id', orderId)
    .maybeSingle();
