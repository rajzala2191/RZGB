import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Package, CheckCircle, Clock, ChevronRight, FileText,
  AlertCircle, Activity, Gavel, BarChart3, Sparkles,
  ArrowRight, FolderOpen, LifeBuoy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

/* ── animated counter ─────────────────────────────────────── */
function AnimatedNumber({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dur = 900;
    const startTime = performance.now();
    const tick = (now) => {
      const p = Math.min((now - startTime) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(value * ease);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

/* ── status config ────────────────────────────────────────── */
const STATUS = {
  OPEN_FOR_BIDDING: { label: 'Open for Bid',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  dot: '#3b82f6' },
  BID_RECEIVED:     { label: 'Bid Received',  color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',   dot: '#06b6d4' },
  AWARDED:          { label: 'Awarded',        color: '#FF6B35', bg: 'rgba(255,107,53,0.1)',  dot: '#FF6B35' },
  MATERIAL:         { label: 'Material',       color: '#FF6B35', bg: 'rgba(255,107,53,0.1)',  dot: '#FF6B35' },
  CASTING:          { label: 'Casting',        color: '#f97316', bg: 'rgba(249,115,22,0.1)',  dot: '#f97316' },
  MACHINING:        { label: 'Machining',      color: '#f97316', bg: 'rgba(249,115,22,0.1)',  dot: '#f97316' },
  QC:               { label: 'QC',             color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  dot: '#a855f7' },
  DISPATCH:         { label: 'Dispatch',       color: '#10b981', bg: 'rgba(16,185,129,0.1)',  dot: '#10b981' },
  DELIVERED:        { label: 'Delivered',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   dot: '#22c55e' },
};
const getStatus = (s) => STATUS[s] || { label: s?.replace(/_/g, ' ') || 'Unknown', color: '#71717a', bg: 'rgba(113,113,122,0.1)', dot: '#71717a' };

/* ── stat card ────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, accent, delay, isDark, sub, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="rounded-2xl p-5 flex flex-col gap-4 cursor-pointer"
      style={{
        background: isDark ? '#111111' : '#ffffff',
        border: `1px solid ${isDark ? '#1f1f1f' : '#e5e5e5'}`,
        boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          <Icon size={19} style={{ color: accent }} />
        </div>
        <BarChart3 size={14} style={{ color: isDark ? '#3f3f46' : '#d4d4d8' }} />
      </div>
      <div>
        <p className="text-3xl font-black tracking-tight" style={{ color: isDark ? '#fafafa' : '#0a0a0a' }}>
          <AnimatedNumber value={value} />
        </p>
        <p className="text-sm font-medium mt-0.5" style={{ color: isDark ? '#71717a' : '#737373' }}>{label}</p>
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
      onMouseEnter={e => e.currentTarget.style.background = isDark ? '#161616' : '#fafafa'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: isDark ? '#1a1a1a' : '#f4f4f5' }}>
          <Package size={16} style={{ color: '#FF6B35' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: isDark ? '#fafafa' : '#0a0a0a' }}>
            {order.public_name || order.part_name || 'Unnamed Order'}
          </p>
          <p className="text-xs font-mono mt-0.5" style={{ color: isDark ? '#52525b' : '#a1a1aa' }}>
            {order.rz_job_id || order.id?.slice(0, 8)} · {new Date(order.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
          {st.label}
        </span>
        <ChevronRight size={15} style={{ color: isDark ? '#3f3f46' : '#d4d4d8' }} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </motion.div>
  );
}

/* ── main ─────────────────────────────────────────────────── */
export default function SupplierDashboard() {
  const { currentUser, userCompanyName } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats]       = useState({ active: 0, completed: 0, available: 0, documents: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const card        = { bg: isDark ? '#111111' : '#ffffff', border: isDark ? '#1f1f1f' : '#e5e5e5' };
  const textPrimary = isDark ? '#fafafa' : '#0a0a0a';
  const textMuted   = isDark ? '#71717a' : '#737373';
  const divider     = isDark ? '#1f1f1f' : '#f0f0f0';

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const [activeRes, completedRes, availableRes, docsRes, recentRes] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact' })
            .eq('supplier_id', currentUser.id)
            .in('order_status', ['AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH']),
          supabase.from('orders').select('id', { count: 'exact' })
            .eq('supplier_id', currentUser.id).eq('order_status', 'DELIVERED'),
          supabase.from('orders').select('id', { count: 'exact' })
            .eq('order_status', 'OPEN_FOR_BIDDING'),
          supabase.from('documents').select('id', { count: 'exact' })
            .eq('supplier_id', currentUser.id),
          supabase.from('orders').select('id, public_name, part_name, rz_job_id, order_status, updated_at')
            .eq('supplier_id', currentUser.id)
            .order('updated_at', { ascending: false }).limit(6),
        ]);
        setStats({
          active:    activeRes.count    || 0,
          completed: completedRes.count || 0,
          available: availableRes.count || 0,
          documents: docsRes.count      || 0,
        });
        if (recentRes.data) setRecentOrders(recentRes.data);
      } catch (err) {
        setError('Failed to load dashboard. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const quickActions = [
    { label: 'View my orders',    icon: Package,    path: '/supplier-hub/orders',    color: '#FF6B35' },
    { label: 'Available jobs',    icon: Gavel,      path: '/supplier-hub/orders',    color: '#3b82f6' },
    { label: 'Documents portal',  icon: FolderOpen, path: '/supplier-hub/documents', color: '#8b5cf6' },
    { label: 'Get support',       icon: LifeBuoy,   path: '/supplier-hub/support',   color: '#10b981' },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  /* loading */
  if (loading) return (
    <SupplierHubLayout>
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-transparent"
          style={{ borderTopColor: '#FF6B35', borderRightColor: 'rgba(255,107,53,0.3)' }}
        />
        <p className="text-sm font-medium" style={{ color: textMuted }}>Loading your dashboard…</p>
      </div>
    </SupplierHubLayout>
  );

  /* error */
  if (error) return (
    <SupplierHubLayout>
      <div className="flex items-center justify-center py-32">
        <div className="rounded-2xl p-8 max-w-sm w-full text-center" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
          <AlertCircle className="mx-auto mb-4" size={36} style={{ color: '#ef4444' }} />
          <p className="font-semibold mb-1" style={{ color: textPrimary }}>Couldn't load dashboard</p>
          <p className="text-sm mb-5" style={{ color: textMuted }}>{error}</p>
          <button onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#FF6B35' }}>Retry</button>
        </div>
      </div>
    </SupplierHubLayout>
  );

  return (
    <SupplierHubLayout>
      <Helmet><title>Dashboard — Supplier Hub</title></Helmet>

      {/* ── Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} style={{ color: '#FF6B35' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#FF6B35' }}>
              {greeting}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: textPrimary }}>
            {userCompanyName || 'Supplier'}
          </h1>
          <p className="text-sm mt-1" style={{ color: textMuted }}>
            Here's your manufacturing pipeline overview.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/supplier-hub/orders')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#FF6B35' }}
        >
          View Orders <ArrowRight size={15} />
        </motion.button>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Orders"    value={stats.active}    icon={Activity}      accent="#FF6B35" delay={0}    isDark={isDark} sub={stats.active > 0 ? 'In production' : null} onClick={() => navigate('/supplier-hub/orders')} />
        <StatCard label="Completed Jobs"   value={stats.completed} icon={CheckCircle}   accent="#22c55e" delay={0.05} isDark={isDark} onClick={() => navigate('/supplier-hub/orders')} />
        <StatCard label="Available to Bid" value={stats.available} icon={Gavel}         accent="#3b82f6" delay={0.1}  isDark={isDark} sub={stats.available > 0 ? 'Open now' : null} onClick={() => navigate('/supplier-hub/orders')} />
        <StatCard label="My Documents"     value={stats.documents} icon={FileText}      accent="#8b5cf6" delay={0.15} isDark={isDark} onClick={() => navigate('/supplier-hub/documents')} />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: card.bg, border: `1px solid ${card.border}` }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: '#FF6B35' }} />
              <span className="text-sm font-bold" style={{ color: textPrimary }}>Recent Orders</span>
            </div>
            <button
              onClick={() => navigate('/supplier-hub/orders')}
              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#FF6B35' }}
            >
              View all <ChevronRight size={13} />
            </button>
          </div>

          <div className="p-3">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: isDark ? '#1a1a1a' : '#f4f4f5' }}>
                  <Package size={22} style={{ color: isDark ? '#3f3f46' : '#d4d4d8' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: textMuted }}>No orders yet</p>
                <button
                  onClick={() => navigate('/supplier-hub/orders')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35' }}
                >
                  Browse available jobs
                </button>
              </div>
            ) : (
              recentOrders.map((order, i) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  index={i}
                  isDark={isDark}
                  onClick={() => navigate(`/supplier-hub/orders/${order.id}`)}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: card.bg, border: `1px solid ${card.border}` }}
          >
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
              <span className="text-sm font-bold" style={{ color: textPrimary }}>Quick Actions</span>
            </div>
            <div className="p-3 space-y-1">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all duration-150 group"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? '#161616' : '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${action.color}15` }}>
                      <action.icon size={15} style={{ color: action.color }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>{action.label}</span>
                  </div>
                  <ChevronRight size={14} style={{ color: isDark ? '#3f3f46' : '#d4d4d8' }} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Pipeline Status */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: card.bg, border: `1px solid ${card.border}` }}
          >
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
              <span className="text-sm font-bold" style={{ color: textPrimary }}>Pipeline Summary</span>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'In Production', value: stats.active,    color: '#FF6B35' },
                { label: 'Completed',     value: stats.completed, color: '#22c55e' },
                { label: 'Available',     value: stats.available, color: '#3b82f6' },
              ].map(({ label, value, color }) => {
                const total = stats.active + stats.completed + stats.available || 1;
                const pct = Math.round((value / total) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-medium" style={{ color: textMuted }}>{label}</span>
                      <span className="text-xs font-bold" style={{ color: textPrimary }}>{value}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? '#1f1f1f' : '#f0f0f0' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </SupplierHubLayout>
  );
}
