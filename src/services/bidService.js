import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notifyNewBid, notifyBidAwarded, notifyNewTender } from '@/services/slackService';
import { dispatchWebhookEvent } from '@/services/webhookService';

const now = () => new Date().toISOString();

export const fetchBidsForOrder = async (orderId) =>
  supabaseAdmin
    .from('bid_submissions')
    .select('*, supplier:supplier_id(id, company_name, email, specialization)')
    .eq('order_id', orderId)
    .order('amount', { ascending: true });

export const fetchBidsBySupplier = async (supplierId) =>
  supabase
    .from('bid_submissions')
    .select('*, order:order_id(id, rz_job_id, part_name, ghost_public_name, material, quantity, order_status, bid_deadline)')
    .eq('supplier_id', supplierId)
    .order('submitted_at', { ascending: false });

export const fetchOpenOrders = async () =>
  supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_status', 'OPEN_FOR_BIDDING')
    .order('updated_at', { ascending: false });

export const fetchOpenOrdersForSupplier = async (supplierId) =>
  supabase
    .from('orders')
    .select('*')
    .eq('order_status', 'OPEN_FOR_BIDDING')
    .order('updated_at', { ascending: false });

export const submitBid = async ({ orderId, supplierId, amount, currency, leadTimeDays, notes, priceBreakdown }) => {
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('order_status, bid_deadline')
    .eq('id', orderId)
    .maybeSingle();
  if (orderErr) throw orderErr;
  if (!order || order.order_status !== 'OPEN_FOR_BIDDING') {
    throw new Error('Order is not open for bidding');
  }
  if (order.bid_deadline && new Date(order.bid_deadline) < new Date()) {
    throw new Error('Bid deadline has passed');
  }

  const { data: existing, error: dupErr } = await supabase
    .from('bid_submissions')
    .select('id')
    .eq('order_id', orderId)
    .eq('supplier_id', supplierId)
    .eq('status', 'pending')
    .maybeSingle();
  if (dupErr) throw dupErr;
  if (existing) {
    throw new Error('A pending bid already exists for this order');
  }

  return supabase
    .from('bid_submissions')
    .insert([{
      order_id: orderId,
      supplier_id: supplierId,
      amount,
      currency: currency || 'GBP',
      lead_time_days: leadTimeDays,
      notes,
      price_breakdown: priceBreakdown || {},
      submitted_at: now(),
    }])
    .select()
    .single();
};

export const updateBidStatus = async (bidId, status) =>
  supabaseAdmin
    .from('bid_submissions')
    .update({ status, updated_at: now() })
    .eq('id', bidId);

export const awardBid = async (bidId, orderId, supplierId) => {
  const { data: order, error: orderCheckErr } = await supabaseAdmin
    .from('orders')
    .select('order_status')
    .eq('id', orderId)
    .maybeSingle();
  if (orderCheckErr) throw orderCheckErr;
  if (!order || order.order_status !== 'OPEN_FOR_BIDDING') {
    throw new Error('Order is not open for bidding');
  }

  const { data: bid, error: bidCheckErr } = await supabaseAdmin
    .from('bid_submissions')
    .select('status')
    .eq('id', bidId)
    .maybeSingle();
  if (bidCheckErr) throw bidCheckErr;
  if (!bid || bid.status !== 'pending') {
    throw new Error('Bid is not in a pending state');
  }

  const { error: awardErr } = await supabaseAdmin
    .from('bid_submissions')
    .update({ status: 'awarded', updated_at: now() })
    .eq('id', bidId);
  if (awardErr) throw awardErr;

  await supabaseAdmin
    .from('bid_submissions')
    .update({ status: 'rejected', updated_at: now() })
    .eq('order_id', orderId)
    .neq('id', bidId)
    .eq('status', 'pending');

  const year = new Date().getFullYear();
  const rzJobId = `RZ-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

  const { error: orderErr } = await supabaseAdmin
    .from('orders')
    .update({
      supplier_id: supplierId,
      order_status: 'AWARDED',
      rz_job_id: rzJobId,
      updated_at: now(),
    })
    .eq('id', orderId);
  if (orderErr) throw orderErr;

  await supabaseAdmin.from('documents')
    .update({ supplier_id: supplierId })
    .eq('order_id', orderId);

  await supabaseAdmin.from('job_updates').insert({
    rz_job_id: rzJobId,
    stage: 'AWARDED',
    note: 'Bid awarded. Order assigned to supplier. Production can begin.',
    updated_by: 'ADMIN',
  });

  const { data: orderDetail } = await supabaseAdmin.from('orders').select('part_name, ghost_public_name').eq('id', orderId).maybeSingle();
  const { data: supplierDetail } = await supabaseAdmin.from('profiles').select('company_name').eq('id', supplierId).maybeSingle();
  const { data: bidDetail } = await supabaseAdmin.from('bid_submissions').select('amount, currency').eq('id', bidId).maybeSingle();

  notifyBidAwarded({
    rzJobId,
    partName: orderDetail?.ghost_public_name || orderDetail?.part_name,
    supplierName: supplierDetail?.company_name || 'Supplier',
    amount: bidDetail?.amount,
    currency: bidDetail?.currency || 'GBP',
  }).catch(() => {});

  dispatchWebhookEvent('bid.awarded', {
    bidId,
    orderId,
    supplierId,
    rzJobId,
    partName: orderDetail?.ghost_public_name || orderDetail?.part_name,
    supplierName: supplierDetail?.company_name,
    amount: bidDetail?.amount,
    currency: bidDetail?.currency || 'GBP',
  }).catch(() => {});

  return { rzJobId };
};

export const openOrderForBidding = async (orderId, deadline) => {
  const update = { order_status: 'OPEN_FOR_BIDDING', updated_at: now() };
  if (deadline) update.bid_deadline = deadline;
  const result = await supabaseAdmin.from('orders').update(update).eq('id', orderId);

  const { data: order } = await supabaseAdmin.from('orders').select('rz_job_id, part_name, ghost_public_name, material, quantity').eq('id', orderId).maybeSingle();
  if (order) {
    notifyNewTender({
      rzJobId: order.rz_job_id || orderId,
      partName: order.ghost_public_name || order.part_name,
      material: order.material,
      quantity: order.quantity,
      deadline,
    }).catch(() => {});
  }

  return result;
};

export const fetchBidCountsForOrders = async (orderIds) =>
  supabaseAdmin
    .from('bid_submissions')
    .select('order_id')
    .in('order_id', orderIds)
    .eq('status', 'pending');

export const withdrawBid = async (bidId) =>
  supabase
    .from('bid_submissions')
    .update({ status: 'withdrawn', updated_at: now() })
    .eq('id', bidId);
