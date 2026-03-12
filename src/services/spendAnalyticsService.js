import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const fetchSpendBySupplier = async () => {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('supplier_id, buy_price, supplier:supplier_id(company_name)')
    .not('buy_price', 'is', null)
    .in('order_status', ['AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH', 'DELIVERED']);

  if (!data) return [];
  const map = {};
  data.forEach(o => {
    const name = o.supplier?.company_name || 'Unknown';
    if (!map[name]) map[name] = { supplier: name, total: 0, count: 0 };
    map[name].total += parseFloat(o.buy_price) || 0;
    map[name].count += 1;
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
};

export const fetchSpendByMaterial = async () => {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('material, buy_price')
    .not('buy_price', 'is', null)
    .not('material', 'is', null)
    .in('order_status', ['AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH', 'DELIVERED']);

  if (!data) return [];
  const map = {};
  data.forEach(o => {
    const mat = o.material || 'Other';
    if (!map[mat]) map[mat] = { material: mat, total: 0, count: 0 };
    map[mat].total += parseFloat(o.buy_price) || 0;
    map[mat].count += 1;
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
};

export const fetchSpendOverTime = async (months = 12) => {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data } = await supabaseAdmin
    .from('orders')
    .select('created_at, buy_price')
    .not('buy_price', 'is', null)
    .gte('created_at', since.toISOString())
    .in('order_status', ['AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH', 'DELIVERED'])
    .order('created_at', { ascending: true });

  if (!data) return [];
  const map = {};
  data.forEach(o => {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { month: key, total: 0, count: 0 };
    map[key].total += parseFloat(o.buy_price) || 0;
    map[key].count += 1;
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
};

export const fetchSpendSummary = async () => {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('buy_price, order_status')
    .not('buy_price', 'is', null);

  if (!data) return { totalSpend: 0, activeOrders: 0, deliveredOrders: 0, avgOrderValue: 0 };

  let totalSpend = 0;
  let activeOrders = 0;
  let deliveredOrders = 0;
  const completed = ['DELIVERED'];
  const active = ['AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH'];

  data.forEach(o => {
    const val = parseFloat(o.buy_price) || 0;
    totalSpend += val;
    if (active.includes(o.order_status)) activeOrders++;
    if (completed.includes(o.order_status)) deliveredOrders++;
  });

  return {
    totalSpend,
    activeOrders,
    deliveredOrders,
    avgOrderValue: data.length ? totalSpend / data.length : 0,
  };
};

export const fetchBidSavings = async () => {
  const { data } = await supabaseAdmin
    .from('bid_submissions')
    .select('order_id, amount, status')
    .in('status', ['awarded', 'pending', 'rejected']);

  if (!data) return [];
  const byOrder = {};
  data.forEach(b => {
    if (!byOrder[b.order_id]) byOrder[b.order_id] = { bids: [], awarded: null };
    byOrder[b.order_id].bids.push(parseFloat(b.amount));
    if (b.status === 'awarded') byOrder[b.order_id].awarded = parseFloat(b.amount);
  });

  let totalSaved = 0;
  let ordersWithSavings = 0;
  Object.values(byOrder).forEach(o => {
    if (o.awarded && o.bids.length > 1) {
      const highest = Math.max(...o.bids);
      const saving = highest - o.awarded;
      if (saving > 0) {
        totalSaved += saving;
        ordersWithSavings++;
      }
    }
  });

  return { totalSaved, ordersWithSavings };
};
