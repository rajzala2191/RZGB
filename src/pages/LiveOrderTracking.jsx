import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import AssetViewer from '@/components/AssetViewer';
import OrderTimeline from '@/components/OrderTimeline';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import {
  Loader2, ArrowLeft, AlertCircle, Package,
  Truck, Calendar, PoundSterling, MapPin, Activity,
} from 'lucide-react';
import {
  fetchOrderStepProgress, fetchSubStepsForProcesses,
} from '@/services/orderService';

const ACCENT = 'var(--brand)';


const STATUS_LABEL = {
  PENDING_ADMIN_SCRUB: { label: 'Pending Review', color: '#f59e0b' },
  SANITIZED:           { label: 'Sanitised',      color: '#8b5cf6' },
  OPEN_FOR_BIDDING:    { label: 'Open to Bid',    color: '#3b82f6' },
  BID_RECEIVED:        { label: 'Bid Received',   color: '#06b6d4' },
  AWARDED:             { label: 'Awarded',         color: ACCENT    },
  MATERIAL:            { label: 'Material',        color: ACCENT    },
  CASTING:             { label: 'Casting',         color: ACCENT    },
  MACHINING:           { label: 'Machining',       color: ACCENT    },
  QC:                  { label: 'QC',              color: '#a855f7' },
  DISPATCH:            { label: 'Dispatch',        color: '#10b981' },
  DELIVERED:           { label: 'Delivered',       color: '#22c55e' },
  WITHDRAWN:           { label: 'Withdrawn',       color: '#ef4444' },
};
const getStatusInfo = (s) => STATUS_LABEL[s] || { label: s?.replace(/_/g, ' ') || '—', color: '#71717a' };

export default function LiveOrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const [order, setOrder]           = useState(null);
  const [updates, setUpdates]       = useState([]);
  const [drawings, setDrawings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [subStepsByKey, setSubStepsByKey] = useState({});
  const [progressById, setProgressById]   = useState({});

  /* ── theme tokens ──────────────────────────────────────── */
  const t = {
    card:       'var(--surface)',
    cardBorder: 'var(--edge-subtle)',
    text:       'var(--heading)',
    textMuted:  'var(--body)',
    textFaint:  'var(--caption)',
    iconBg:     'var(--edge-subtle)',
    divider:    'var(--edge-subtle)',
    backColor:  'var(--faint)',
    backHover:  'var(--heading)',
    mono:       'var(--faint)',
  };

  /* ── data fetch ─────────────────────────────────────────── */
  const fetchOrderData = async () => {
    if (!currentUser?.id) return;
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders').select('*').eq('id', orderId).maybeSingle();
      if (orderError) throw orderError;
      if (!orderData) { setError('Order not found or access denied.'); setLoading(false); return; }
      setOrder(orderData);

      if (orderData.rz_job_id) {
        const { data: updatesData } = await supabase
          .from('job_updates').select('*')
          .eq('rz_job_id', orderData.rz_job_id)
          .order('created_at', { ascending: true });
        setUpdates(updatesData || []);
      } else { setUpdates([]); }

      const { data: docsData } = await supabaseAdmin
        .from('documents').select('id, file_name, file_path')
        .eq('order_id', orderData.id).order('created_at', { ascending: false });

      const drawingsWithUrls = await Promise.all(
        (docsData || []).map(async (doc) => {
          const { data: urlData } = await supabaseAdmin.storage
            .from('documents').createSignedUrl(doc.file_path, 86400);
          return {
            id: doc.id,
            asset_name: doc.file_name,
            asset_type: doc.file_name?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
            file_size: null,
            download_enabled: true,
            file_url: urlData?.signedUrl || null,
          };
        })
      );
      setDrawings(drawingsWithUrls);

      // Load sub-step progress for read-only display
      if (orderData.selected_processes?.length) {
        const { data: procs } = await supabase
          .from('manufacturing_processes')
          .select('id, status_key')
          .in('status_key', orderData.selected_processes);
        if (procs?.length) {
          const { data: steps } = await fetchSubStepsForProcesses(procs.map(p => p.id));
          if (steps) {
            const byKey = {};
            procs.forEach(proc => { byKey[proc.status_key] = steps.filter(s => s.process_id === proc.id); });
            setSubStepsByKey(byKey);
          }
        }
        const { data: prog } = await fetchOrderStepProgress(orderData.id);
        if (prog) setProgressById(Object.fromEntries(prog.map(p => [p.sub_step_id, p])));
      }

      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to load order data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchOrderData();
    const channel = supabase.channel(`live-tracking-${orderId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_updates' }, fetchOrderData)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, fetchOrderData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [orderId, currentUser]);

  /* ── loading ────────────────────────────────────────────── */
  if (loading) return (
    <ClientDashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: ACCENT }} />
          <p style={{ color: t.textMuted }} className="text-sm">Loading order…</p>
        </div>
      </div>
    </ClientDashboardLayout>
  );

  if (error || !order) return (
    <ClientDashboardLayout>
      <div className="rounded-2xl p-8 text-center mt-4" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
        <AlertCircle size={28} style={{ color: '#ef4444' }} className="mx-auto mb-3" />
        <p className="font-semibold mb-4" style={{ color: '#ef4444' }}>{error || 'Order not found'}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => { setLoading(true); setError(null); fetchOrderData(); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #f97316)` }}
          >Retry</button>
          <button
            onClick={() => navigate('/client-dashboard/orders')}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: t.card, border: `1px solid ${t.cardBorder}`, color: t.textMuted }}
          >Back to Orders</button>
        </div>
      </div>
    </ClientDashboardLayout>
  );

  /* ── derived values ─────────────────────────────────────── */
  const statusInfo     = getStatusInfo(order.order_status);
  const daysRequested  = order.delivery_days || 60;
  const dueDate        = new Date(new Date(order.created_at).getTime() + daysRequested * 86400000);
  const daysRemaining  = Math.ceil((dueDate - new Date()) / 86400000);
  const isWithdrawn    = order.order_status === 'WITHDRAWN';
  const isOnTrack      = !isWithdrawn && daysRemaining > 0;

  const infoCards = [
    { label: 'Quantity',    value: order.quantity?.toLocaleString() || '—',    sub: order.material || '',      icon: Package,        color: '#3b82f6' },
    { label: 'Price per Part', value: order.unit_price ? `£${order.unit_price}` : '—',
      sub: order.unit_price ? 'Per part · ex VAT' : 'Pending bid award',
      icon: PoundSterling, color: '#22c55e' },
    { label: 'Target Delivery', value: `${daysRequested}d`, sub: format(dueDate, 'MMM d, yyyy'), icon: Calendar, color: '#f59e0b' },
    { label: 'Deliver To',  value: order.delivery_to || 'To your door',         sub: 'Delivery address',        icon: MapPin,         color: '#a855f7' },
  ];

  return (
    <ClientDashboardLayout>
      <Helmet><title>{`${order.part_name || 'Order'} — Tracking`}</title></Helmet>

      <div className="space-y-6">

        {/* ── Back + Header ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors"
            style={{ color: t.backColor }}
            onMouseEnter={e => e.currentTarget.style.color = t.backHover}
            onMouseLeave={e => e.currentTarget.style.color = t.backColor}
          >
            <ArrowLeft size={15} /> Back to Orders
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Live indicator */}
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: ACCENT }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: ACCENT }} />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: t.textFaint }}>Live Tracking</span>
              </div>

              <h1 className="text-2xl font-bold mb-1" style={{ color: t.text }}>
                {order.part_name || 'Order'}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg" style={{ background: t.iconBg, color: t.mono }}>
                  {order.rz_job_id || 'Job ID pending'}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusInfo.color }} />
                  {statusInfo.label}
                </span>
              </div>
            </div>

            {/* On-track badge */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shrink-0"
              style={{
                background: isWithdrawn ? 'rgba(239,68,68,0.1)' : isOnTrack ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border:     `1px solid ${isWithdrawn ? 'rgba(239,68,68,0.2)' : isOnTrack ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color:      isWithdrawn ? '#ef4444' : isOnTrack ? '#22c55e' : '#ef4444',
              }}
            >
              <Activity size={15} />
              {isWithdrawn
                ? 'Withdrawn'
                : `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ${isOnTrack ? 'remaining' : 'overdue'}`
              }
            </div>
          </div>
        </motion.div>

        {/* ── Info cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {infoCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.05 + i * 0.06 }}
              className="rounded-2xl p-5"
              style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textFaint }}>{card.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${card.color}18` }}>
                  <card.icon size={14} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-xl font-bold leading-none mb-1.5" style={{ color: t.text }}>{card.value}</p>
              <p className="text-xs truncate" style={{ color: t.textFaint }}>{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Pipeline ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.28 }}
          className="rounded-2xl p-6"
          style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}
        >
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: t.textFaint }}>
            Manufacturing Pipeline
          </h2>

          <OrderTimeline
            currentStatus={order.order_status}
            createdAt={order.created_at}
            updatedAt={order.updated_at}
            updates={updates}
            isWithdrawn={isWithdrawn}
            selectedProcesses={order.selected_processes}
            subStepsByKey={subStepsByKey}
            progressBySubStepId={progressById}
          />
        </motion.div>

        {/* ── Drawings / Documents ─────────────────────────── */}
        {drawings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <AssetViewer orderId={order.id} assets={drawings} />
          </motion.div>
        )}
      </div>
    </ClientDashboardLayout>
  );
}
