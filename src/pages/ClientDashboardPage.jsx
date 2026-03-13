import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useClientOrders } from '@/contexts/ClientContext';
import {
  Package, CheckCircle, Clock, ArrowRight, TrendingUp,
  AlertCircle, FileText, PlusCircle, Layers, Activity,
  ChevronRight, Sparkles, BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/* ── animated counter ─────────────────────────────────────── */
function AnimatedNumber({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = 0;
    const end = value;
    const dur = 900;
    const startTime = performance.now();
    const tick = (now) => {
      const p = Math.min((now - startTime) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (end - start) * ease);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

/* ── status config ────────────────────────────────────────── */
const STATUS = {
  PENDING_ADMIN_SCRUB: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' },
  SANITIZED:           { label: 'Sanitised',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', dot: '#8b5cf6' },
  OPEN_FOR_BIDDING:    { label: 'Open to Bid',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', dot: '#3b82f6' },
  BID_RECEIVED:        { label: 'Bid Received',   color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  dot: '#06b6d4' },
  AWARDED:             { label: 'Awarded',         color: '#FF6B35', bg: 'rgba(255,107,53,0.1)', dot: '#FF6B35' },
  MATERIAL:            { label: 'Material',        color: '#FF6B35', bg: 'rgba(255,107,53,0.1)', dot: '#FF6B35' },
  CASTING:             { label: 'Casting',         color: '#FF6B35', bg: 'rgba(255,107,53,0.1)', dot: '#FF6B35' },
  MACHINING:           { label: 'Machining',       color: '#FF6B35', bg: 'rgba(255,107,53,0.1)', dot: '#FF6B35' },
  QC:                  { label: 'QC',              color: '#a855f7', bg: 'rgba(168,85,247,0.1)', dot: '#a855f7' },
  DISPATCH:            { label: 'Dispatch',        color: '#10b981', bg: 'rgba(16,185,129,0.1)', dot: '#10b981' },
  DELIVERED:           { label: 'Delivered',       color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  dot: '#22c55e' },
};

const getStatus = (s) => STATUS[s] || { label: s?.replace(/_/g, ' ') || 'Draft', color: '#71717a', bg: 'rgba(113,113,122,0.1)', dot: '#71717a' };

/* ── stat card ────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, accent, delay, isDark, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="rounded-2xl p-5 flex flex-col gap-4 cursor-default glass-surface"
      style={{
        background:  'var(--surface)',
        border:      `1px solid var(--edge)`,
        boxShadow:   isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--edge-subtle)' }}
        >
          <Icon size={19} style={{ color: 'var(--caption)' }} />
        </div>
        <BarChart3 size={14} style={{ color: 'var(--edge-strong)' }} />
      </div>
      <div>
        <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--heading)' }}>
          <AnimatedNumber value={value} />
        </p>
        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--body)' }}>{label}</p>
        {sub && <p className="text-xs mt-1 font-medium" style={{ color: accent }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── order row ────────────────────────────────────────────── */
function OrderRow({ order, onClick, isDark, index }) {
  const st = getStatus(order.order_status);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-150 group"
      style={{ background: 'transparent' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-inset)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--surface-raised)' }}
        >
          <FileText size={16} style={{ color: 'var(--caption)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--heading)' }}>
            {order.part_name || 'Unnamed Order'}
          </p>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--caption)' }}>
            {order.rz_job_id || order.id?.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: st.bg, color: st.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
          {st.label}
        </span>
        <ChevronRight size={15} style={{ color: 'var(--edge-strong)' }} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </motion.div>
  );
}

/* ── main ─────────────────────────────────────────────────── */
export default function ClientDashboardPage() {
  const { userCompanyName } = useAuth();
  const { isDark } = useTheme();
  const { orders, loading, error } = useClientOrders();
  const navigate = useNavigate();

  const card = { bg: 'var(--surface)', border: 'var(--edge)' };
  const textPrimary  = 'var(--heading)';
  const textMuted    = 'var(--body)';
  const divider      = 'var(--edge-subtle)';

  /* ── loading ── */
  if (loading) return (
    <ClientDashboardLayout>
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-transparent"
          style={{ borderTopColor: 'var(--brand)', borderRightColor: 'var(--brand-glow)' }}
        />
        <p className="text-sm font-medium" style={{ color: textMuted }}>Loading your dashboard…</p>
      </div>
    </ClientDashboardLayout>
  );

  /* ── error ── */
  if (error) return (
    <ClientDashboardLayout>
      <div className="flex items-center justify-center py-32">
        <div className="rounded-2xl p-8 max-w-sm w-full text-center" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
          <AlertCircle className="mx-auto mb-4" size={36} style={{ color: '#ef4444' }} />
          <p className="font-semibold mb-1" style={{ color: textPrimary }}>Couldn't load dashboard</p>
          <p className="text-sm mb-5" style={{ color: textMuted }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand)' }}
          >Retry</button>
        </div>
      </div>
    </ClientDashboardLayout>
  );

  const totalOrders     = orders.length;
  const activeOrders    = orders.filter(o => o.order_status !== 'DELIVERED').length;
  const completedOrders = orders.filter(o => o.order_status === 'DELIVERED').length;
  const pendingReview   = orders.filter(o => o.order_status === 'PENDING_ADMIN_SCRUB').length;
  const recentOrders    = orders.slice(0, 6);

  /* ── quick actions ── */
  const quickActions = [
    { label: 'Track an order',     icon: Activity,    path: '/client-dashboard/orders'    },
    { label: 'Browse documents',   icon: FileText,    path: '/client-dashboard/documents' },
    { label: 'View profile',       icon: Package,     path: '/client-dashboard/profile'   },
    { label: 'Get support',        icon: AlertCircle, path: '/client-dashboard/support'   },
  ];

  return (
    <ClientDashboardLayout>
      <Helmet><title>Dashboard — Client Portal</title></Helmet>

      {/* ── Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-none" style={{ color: textPrimary }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span style={{ color: 'var(--brand)' }}>{userCompanyName || 'Partner'}</span>
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: textMuted }}>
            Here's an overview of your manufacturing pipeline.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/client-dashboard/create-order')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--brand), #f97316)', boxShadow: '0 4px 14px rgba(255,107,53,0.35)' }}
        >
          <Sparkles size={15} />
          Create New Order
        </motion.button>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders"   value={totalOrders}     icon={Layers}      accent="var(--brand)" delay={0}    isDark={isDark} />
        <StatCard label="In Progress"    value={activeOrders}    icon={TrendingUp}  accent="#3b82f6" delay={0.06} isDark={isDark} />
        <StatCard label="Delivered"      value={completedOrders} icon={CheckCircle} accent="#22c55e" delay={0.12} isDark={isDark} />
        <StatCard label="Pending Review" value={pendingReview}   icon={Clock}       accent="#f59e0b" delay={0.18} isDark={isDark}
          sub={pendingReview > 0 ? 'Awaiting admin review' : undefined}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Recent orders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="xl:col-span-2 rounded-2xl glass-surface"
          style={{ background: card.bg, border: `1px solid ${card.border}`, boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--edge-subtle)' }}>
                <Package size={16} style={{ color: 'var(--caption)' }} />
              </div>
              <p className="font-bold text-sm" style={{ color: textPrimary }}>Recent Orders</p>
            </div>
            <button
              onClick={() => navigate('/client-dashboard/orders')}
              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--brand)' }}
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          {/* Order list */}
          <div className="divide-y" style={{ borderColor: divider }}>
            {recentOrders.length > 0 ? recentOrders.map((order, i) => (
              <OrderRow
                key={order.id}
                order={order}
                index={i}
                isDark={isDark}
                onClick={() => navigate(`/client-dashboard/orders/${order.id}/tracking`)}
              />
            )) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-raised)' }}>
                  <Package size={22} style={{ color: 'var(--edge-strong)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: textMuted }}>No orders yet</p>
                <button
                  onClick={() => navigate('/client-dashboard/create-order')}
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: 'var(--brand)' }}
                >
                  Create your first order →
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            className="rounded-2xl glass-surface"
            style={{ background: card.bg, border: `1px solid ${card.border}`, boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
              <p className="font-bold text-sm" style={{ color: textPrimary }}>Quick Actions</p>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {quickActions.map(({ label, icon: Icon, path }) => (
                <motion.button
                  key={path}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(path)}
                  className="flex flex-col items-start gap-2.5 p-3 rounded-xl text-left transition-all"
                  style={{ background: 'var(--surface-raised)', border: `1px solid var(--edge-subtle)` }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-inset)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-raised)'; }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--edge-subtle)' }}>
                    <Icon size={14} style={{ color: 'var(--caption)' }} />
                  </div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: textPrimary }}>{label}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Pipeline summary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.28 }}
            className="rounded-2xl glass-surface"
            style={{ background: card.bg, border: `1px solid ${card.border}`, boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
              <p className="font-bold text-sm" style={{ color: textPrimary }}>Pipeline Breakdown</p>
            </div>
            <div className="p-4 space-y-3">
              {totalOrders === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: textMuted }}>No data yet.</p>
              ) : [
                { label: 'In Production',   count: orders.filter(o => ['MATERIAL','CASTING','MACHINING','QC'].includes(o.order_status)).length, color: '#FF6B35' },
                { label: 'Awaiting Dispatch', count: orders.filter(o => o.order_status === 'DISPATCH').length, color: '#3b82f6' },
                { label: 'Delivered',        count: completedOrders, color: '#22c55e' },
                { label: 'Under Review',     count: pendingReview,   color: '#f59e0b' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium" style={{ color: textMuted }}>{label}</span>
                    <span className="text-xs font-bold" style={{ color: textPrimary }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-raised)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${totalOrders > 0 ? (count / totalOrders) * 100 : 0}%` }}
                      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
}
