import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  ArrowRight,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  XCircle,
  Activity,
  CheckCircle2,
  Clock,
  PackageX,
  Zap,
} from 'lucide-react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import OrderTimeline from '@/components/OrderTimeline';

const WITHDRAWABLE = [
  'PENDING_ADMIN_SCRUB',
  'SANITIZED',
  'OPEN_FOR_BIDDING',
  'BID_RECEIVED',
  'AWARDED',
];

const STATUS = {
  PENDING_ADMIN_SCRUB: {
    label: 'Pending Review',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  SANITIZED: { label: 'Sanitised', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  OPEN_FOR_BIDDING: { label: 'Open to Bid', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  BID_RECEIVED: { label: 'Bid Received', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  AWARDED: { label: 'Awarded', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)' },
  MATERIAL: { label: 'Material', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)' },
  CASTING: { label: 'Casting', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)' },
  MACHINING: { label: 'Machining', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)' },
  QC: { label: 'QC', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  DISPATCH: { label: 'Dispatch', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  DELIVERED: { label: 'Delivered', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  WITHDRAWN: { label: 'Withdrawn', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const getStatus = (s) =>
  STATUS[s] || { label: s?.replace(/_/g, ' ') || '—', color: '#71717a', bg: 'rgba(113,113,122,0.1)' };

const ACCENT = '#FF6B35';

export default function OrdersOverviewView({
  orders,
  loading,
  error,
  isDark,
  withdrawingId,
  confirmId,
  clearingWithdrawn,
  hoveredRow,
  onHoverRow,
  onLeaveRow,
  onRequestWithdraw,
  onCancelWithdraw,
  onWithdraw,
  onClearWithdrawn,
  onCreateOrder,
  onTrackOrder,
}) {
  const t = isDark
    ? {
        page: '#09090b',
        card: 'rgba(255,255,255,0.04)',
        cardBorder: 'rgba(255,255,255,0.08)',
        thead: 'rgba(255,255,255,0.04)',
        divider: 'rgba(255,255,255,0.06)',
        rowHover: 'rgba(255,255,255,0.03)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
        textFaint: 'rgba(255,255,255,0.3)',
        mono: 'rgba(255,255,255,0.35)',
        badge: 'rgba(255,255,255,0.07)',
        badgeBorder: 'rgba(255,255,255,0.1)',
      }
    : {
        page: '#f0f0f2',
        card: '#ffffff',
        cardBorder: 'rgba(0,0,0,0.08)',
        thead: 'rgba(0,0,0,0.03)',
        divider: 'rgba(0,0,0,0.06)',
        rowHover: 'rgba(0,0,0,0.025)',
        text: '#0f0f0f',
        textMuted: 'rgba(0,0,0,0.5)',
        textFaint: 'rgba(0,0,0,0.35)',
        mono: 'rgba(0,0,0,0.35)',
        badge: 'rgba(0,0,0,0.05)',
        badgeBorder: 'rgba(0,0,0,0.09)',
      };

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Briefcase, color: ACCENT },
    {
      label: 'In Production',
      value: orders.filter((o) =>
        ['MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH'].includes(o.order_status),
      ).length,
      icon: Activity,
      color: '#3b82f6',
    },
    {
      label: 'Delivered',
      value: orders.filter((o) => o.order_status === 'DELIVERED').length,
      icon: CheckCircle2,
      color: '#22c55e',
    },
    {
      label: 'Pending',
      value: orders.filter((o) =>
        ['PENDING_ADMIN_SCRUB', 'SANITIZED', 'OPEN_FOR_BIDDING', 'BID_RECEIVED'].includes(
          o.order_status,
        ),
      ).length,
      icon: Clock,
      color: '#f59e0b',
    },
  ];

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin" style={{ color: ACCENT }} />
            <p style={{ color: t.textMuted }} className="text-sm">
              Loading your orders…
            </p>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (error) {
    return (
      <ClientDashboardLayout>
        <div
          className="flex items-center gap-3 p-6 rounded-2xl mt-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={20} style={{ color: '#ef4444' }} />
          <p style={{ color: '#ef4444' }} className="text-sm font-medium">
            Failed to load orders: {error}
          </p>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <Helmet>
        <title>My Orders — Client Portal</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: t.text }}>
              My Orders
            </h1>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: t.badge, color: t.textMuted, border: `1px solid ${t.badgeBorder}` }}
            >
              {orders.length}
            </span>
          </div>
          <p className="text-sm" style={{ color: t.textMuted }}>
            Track all your manufacturing orders and their progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orders.some((o) => o.order_status === 'WITHDRAWN') && (
            <button
              onClick={onClearWithdrawn}
              disabled={clearingWithdrawn}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-50"
              style={{
                background: 'rgba(239,68,68,0.08)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.18)',
              }}
            >
              {clearingWithdrawn ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Clear Withdrawn
            </button>
          )}
          <button
            onClick={onCreateOrder}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #f97316)`,
              boxShadow: '0 2px 12px rgba(255,107,53,0.25)',
            }}
          >
            <Zap size={14} /> New Order
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="rounded-2xl p-4"
            style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.textFaint }}>
                {s.label}
              </p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: t.text }}>
              {s.value}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}
      >
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: t.badge }}>
              <PackageX size={24} style={{ color: t.textFaint }} />
            </div>
            <div className="text-center">
              <p className="font-semibold mb-1" style={{ color: t.text }}>
                No orders yet
              </p>
              <p className="text-sm" style={{ color: t.textMuted }}>
                Create your first order to get started.
              </p>
            </div>
            <button
              onClick={onCreateOrder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mt-2"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #f97316)` }}
            >
              <Plus size={15} /> New Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ background: t.thead, borderBottom: `1px solid ${t.divider}` }}>
                  {['Job ID', 'Part Name', 'Material', 'Qty', 'Status', 'Progress', 'Created', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: t.textFaint }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {orders.map((order, i) => {
                    const st = getStatus(order.order_status);
                    const isHovered = hoveredRow === order.id;
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        onMouseEnter={() => onHoverRow(order.id)}
                        onMouseLeave={onLeaveRow}
                        style={{
                          borderBottom: `1px solid ${t.divider}`,
                          background: isHovered ? t.rowHover : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-bold" style={{ color: t.mono }}>
                            {order.rz_job_id || order.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold" style={{ color: t.text }}>
                            {order.part_name}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span style={{ color: t.textMuted }}>{order.material || '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold" style={{ color: t.text }}>
                            {order.quantity}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                            style={{ background: st.bg, color: st.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.color }} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 w-36">
                          <OrderTimeline currentStatus={order.order_status} compact />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs" style={{ color: t.textFaint }}>
                            {new Date(order.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onTrackOrder(order.id)}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-150"
                              style={{
                                color: ACCENT,
                                background: 'rgba(255,107,53,0.08)',
                                border: '1px solid rgba(255,107,53,0.18)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,107,53,0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,107,53,0.08)';
                              }}
                            >
                              Track <ArrowRight size={12} />
                            </button>
                            {WITHDRAWABLE.includes(order.order_status) &&
                              (confirmId === order.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onWithdraw(order.id)}
                                    disabled={withdrawingId === order.id}
                                    className="text-xs font-bold px-2 py-1 rounded-lg disabled:opacity-50"
                                    style={{
                                      background: 'rgba(239,68,68,0.1)',
                                      color: '#ef4444',
                                      border: '1px solid rgba(239,68,68,0.2)',
                                    }}
                                  >
                                    {withdrawingId === order.id ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      'Confirm'
                                    )}
                                  </button>
                                  <button type="button" onClick={onCancelWithdraw} style={{ color: t.textFaint }}>
                                    <XCircle size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRequestWithdraw(order.id);
                                  }}
                                  className="p-1.5 rounded-lg transition-all duration-150"
                                  style={{ color: t.textFaint }}
                                  title="Withdraw Order"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ef4444';
                                    e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = t.textFaint;
                                    e.currentTarget.style.background = 'transparent';
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              ))}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </ClientDashboardLayout>
  );
}
