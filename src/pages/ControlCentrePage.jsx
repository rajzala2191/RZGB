import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Users, Shield, Briefcase, Truck, AlertCircle, Clock, CheckCircle2,
  ShieldCheck, Network, Radio, FolderOpen, LifeBuoy, ChevronRight,
  ArrowRight, RefreshCw, Database, Lock, Mail, Zap, Activity,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDistanceToNow } from 'date-fns';

// ── Order pipeline stage groups ────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { label: 'Pending Review', statuses: ['PENDING_ADMIN_SCRUB'], color: '#f59e0b', path: '/control-centre/sanitisation-gate' },
  { label: 'Sanitised',      statuses: ['SANITIZED'],            color: '#3b82f6', path: '/control-centre/sanitisation-gate' },
  { label: 'Open Bidding',   statuses: ['OPEN_FOR_BIDDING', 'BID_RECEIVED'], color: '#8b5cf6', path: '/control-centre/supplier-pool' },
  { label: 'Awarded',        statuses: ['AWARDED'],              color: '#FF6B35', path: '/control-centre/live-tracking' },
  { label: 'Production',     statuses: ['MATERIAL', 'CASTING', 'MACHINING'], color: '#06b6d4', path: '/control-centre/live-tracking' },
  { label: 'QC & Dispatch',  statuses: ['QC', 'DISPATCH'],       color: '#22c55e', path: '/control-centre/live-tracking' },
  { label: 'Delivered',      statuses: ['DELIVERED'],            color: '#6b7280', path: '/control-centre/live-tracking' },
];

// ── Quick action tiles ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Sanitisation Gate', icon: ShieldCheck, path: '/control-centre/sanitisation-gate', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { label: 'Assign to Supplier', icon: Network,    path: '/control-centre/supplier-pool',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { label: 'Live Tracking',      icon: Radio,      path: '/control-centre/live-tracking',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  { label: 'User Management',    icon: Users,      path: '/control-centre/users',              color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  { label: 'Document Review',    icon: FolderOpen, path: '/control-centre/document-review',    color: '#FF6B35', bg: 'rgba(255,107,53,0.1)'  },
  { label: 'Support',            icon: LifeBuoy,   path: '/control-centre/support',            color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'   },
];

const ACCENT = '#FF6B35';

// ── Urgency badge based on age ─────────────────────────────────────────────────
function UrgencyBadge({ createdAt }) {
  const hours = (Date.now() - new Date(createdAt)) / 36e5;
  if (hours > 24) return <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }} className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Urgent</span>;
  if (hours > 8)  return <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }} className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Waiting</span>;
  return <span style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }} className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>;
}

// ── Live clock ─────────────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ── Main component ─────────────────────────────────────────────────────────────
const ControlCentrePage = () => {
  const navigate    = useNavigate();
  const { orders, pendingOrdersCount } = useOrders();
  const { currentUser, userCompanyName } = useAuth();
  const { isDark }  = useTheme();
  const clock       = useClock();

  const [stats, setStats]       = useState({ total: 0, admins: 0, clients: 0, suppliers: 0 });
  const [sysStatus, setSysStatus] = useState({ db: 'checking', auth: 'checking', email: 'checking' });
  const [sysLoading, setSysLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // ── Color tokens ──────────────────────────────────────────────────────────────
  const cardBg     = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textPri    = isDark ? '#ffffff' : '#0f0f0f';
  const textSec    = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const textMid    = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const rowHover   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const rowBorder  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // ── Stats fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('profiles').select('role').then(({ data }) => {
      if (!data) return;
      setStats({
        total:     data.length,
        admins:    data.filter(p => p.role === 'admin').length,
        clients:   data.filter(p => p.role === 'client').length,
        suppliers: data.filter(p => p.role === 'supplier').length,
      });
    });
  }, []);

  // ── System status check ───────────────────────────────────────────────────────
  const checkSystem = useCallback(async () => {
    setSysLoading(true);
    const s = { db: 'error', auth: 'error', email: 'warning' };
    try {
      const { error: dbErr } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (!dbErr) s.db = 'ok';
      const { error: authErr } = await supabase.auth.getSession();
      if (!authErr) { s.auth = 'ok'; s.email = 'ok'; }
      setSysStatus(s);
      setLastSync(new Date());
    } finally {
      setSysLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSystem();
    const iv = setInterval(checkSystem, 60000);
    return () => clearInterval(iv);
  }, [checkSystem]);

  // ── Derived data ──────────────────────────────────────────────────────────────
  const pendingList = [...orders]
    .filter(o => o.order_status === 'PENDING_ADMIN_SCRUB')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 6);

  const pipelineCounts = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: orders.filter(o => stage.statuses.includes(o.order_status)).length,
  }));

  const hour     = clock.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name     = userCompanyName || currentUser?.email?.split('@')[0] || 'Admin';
  const allOk    = Object.values(sysStatus).every(v => v === 'ok');

  // ── KPI cards config ──────────────────────────────────────────────────────────
  const KPI_CARDS = [
    { label: 'Total Users',   value: stats.total,     icon: Users,    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
    { label: 'Clients',       value: stats.clients,   icon: Briefcase,color: '#FF6B35', bg: 'rgba(255,107,53,0.1)'  },
    { label: 'Suppliers',     value: stats.suppliers, icon: Truck,    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)'  },
    { label: 'Admins',        value: stats.admins,    icon: Shield,   color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
    {
      label: 'Pending Review', value: pendingOrdersCount, icon: AlertCircle,
      color: pendingOrdersCount > 0 ? '#f59e0b' : '#22c55e',
      bg:    pendingOrdersCount > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
      alert: pendingOrdersCount > 0,
      onClick: () => navigate('/control-centre/sanitisation-gate'),
    },
  ];

  return (
    <ControlCentreLayout>
      <Helmet><title>Command Centre — RZ Global Solutions</title></Helmet>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

        {/* ── Command Header ─────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl p-5"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>
              Control Centre
            </p>
            <h1 className="text-2xl font-bold leading-tight" style={{ color: textPri }}>
              {greeting}, {name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: textSec }}>
              {clock.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live clock */}
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-mono font-bold tabular-nums" style={{ color: textPri }}>
                {clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
            {/* System health pill */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: allOk ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                border:     `1px solid ${allOk ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
                color:      allOk ? '#22c55e' : '#f59e0b',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: allOk ? '#22c55e' : '#f59e0b' }} />
              {allOk ? 'All Systems Nominal' : 'Action Required'}
            </div>
          </div>
        </motion.div>

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {KPI_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              variants={fadeUp}
              onClick={card.onClick}
              className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200"
              style={{
                background: cardBg,
                border:     `1px solid ${card.alert ? 'rgba(245,158,11,0.3)' : cardBorder}`,
                cursor:     card.onClick ? 'pointer' : 'default',
              }}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                  <card.icon size={17} style={{ color: card.color }} />
                </div>
                {card.alert && (
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#f59e0b' }} />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: card.alert ? '#f59e0b' : textPri }}>
                  {card.value}
                </p>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: textSec }}>
                  {card.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Live Order Pipeline ─────────────────────────────────────────── */}
        <motion.div variants={fadeUp}
          className="rounded-2xl p-5"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={15} style={{ color: ACCENT }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: textPri }}>
                Live Order Pipeline
              </h2>
            </div>
            <span className="text-xs" style={{ color: textSec }}>{orders.length} total orders</span>
          </div>

          <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
            {pipelineCounts.map((stage, i) => (
              <React.Fragment key={stage.label}>
                <button
                  onClick={() => navigate(stage.path)}
                  className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl min-w-[100px] flex-1 transition-all duration-150 group"
                  style={{ background: stage.count > 0 ? `${stage.color}12` : 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${stage.color}18`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = stage.count > 0 ? `${stage.color}12` : 'transparent'; }}
                >
                  <div
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: stage.count > 0 ? stage.color : textSec }}
                  >
                    {stage.count}
                  </div>
                  <div
                    className="w-full h-1 rounded-full"
                    style={{ background: stage.count > 0 ? stage.color : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)') }}
                  />
                  <p className="text-[10px] font-semibold text-center leading-tight" style={{ color: stage.count > 0 ? stage.color : textSec }}>
                    {stage.label}
                  </p>
                </button>
                {i < pipelineCounts.length - 1 && (
                  <div className="flex items-center px-0.5 shrink-0">
                    <ArrowRight size={12} style={{ color: textSec }} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* ── Bottom grid: Scrub Queue + Quick Actions ────────────────────── */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Priority Scrub Queue */}
          <div
            className="lg:col-span-2 rounded-2xl flex flex-col"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${rowBorder}` }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} style={{ color: '#f59e0b' }} />
                <h2 className="text-sm font-bold" style={{ color: textPri }}>Priority Scrub Queue</h2>
                {pendingOrdersCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    {pendingOrdersCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/control-centre/sanitisation-gate')}
                className="flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: ACCENT }}
              >
                View all <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex-1 p-3 space-y-1.5">
              {pendingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: textSec }}>All clear — no pending orders</p>
                </div>
              ) : (
                pendingList.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 cursor-pointer"
                    style={{ border: `1px solid transparent` }}
                    onMouseEnter={e => { e.currentTarget.style.background = rowHover; e.currentTarget.style.borderColor = rowBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                    onClick={() => navigate(`/control-centre/sanitisation-gate/review/${order.id}`)}
                  >
                    {/* Urgency dot */}
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
                      style={{ background: (Date.now() - new Date(order.created_at)) / 36e5 > 24 ? '#ef4444' : (Date.now() - new Date(order.created_at)) / 36e5 > 8 ? '#f59e0b' : '#22c55e' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: textPri }}>
                        {order.rz_job_id || order.part_name || `Order #${order.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs truncate" style={{ color: textSec }}>
                        {order.client?.company_name || order.client?.email || 'Unknown client'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <UrgencyBadge createdAt={order.created_at} />
                      <span className="text-[11px] flex items-center gap-1" style={{ color: textSec }}>
                        <Clock size={11} />
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </span>
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                        style={{ background: 'rgba(255,107,53,0.1)', color: ACCENT }}>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="rounded-2xl flex flex-col"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${rowBorder}` }}>
              <Zap size={15} style={{ color: ACCENT }} />
              <h2 className="text-sm font-bold" style={{ color: textPri }}>Quick Actions</h2>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2 flex-1">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2.5 p-3 rounded-xl transition-all duration-150 text-center group"
                  style={{ background: action.bg, border: `1px solid ${action.color}22` }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 4px 16px ${action.color}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${action.color}20` }}>
                    <action.icon size={16} style={{ color: action.color }} />
                  </div>
                  <span className="text-[11px] font-semibold leading-tight" style={{ color: textMid }}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── System Status (inline compact) ─────────────────────────────── */}
        <motion.div variants={fadeUp}
          className="rounded-2xl p-4"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={13} style={{ color: textSec }} />
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: textSec }}>System Health</h2>
            </div>
            <div className="flex items-center gap-3">
              {lastSync && (
                <span className="text-[11px]" style={{ color: textSec }}>
                  Last sync {formatDistanceToNow(lastSync, { addSuffix: true })}
                </span>
              )}
              <button
                onClick={checkSystem}
                disabled={sysLoading}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: textSec }}
                onMouseEnter={e => { e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.color = textSec; }}
              >
                <RefreshCw size={13} className={sysLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'Database',       key: 'db',    icon: Database },
              { label: 'Auth Services',  key: 'auth',  icon: Lock     },
              { label: 'Email Gateway',  key: 'email', icon: Mail     },
            ].map(({ label, key, icon: Icon }) => {
              const s = sysStatus[key];
              const dotColor = s === 'ok' ? '#22c55e' : s === 'warning' ? '#f59e0b' : s === 'error' ? '#ef4444' : '#6b7280';
              return (
                <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
                  <Icon size={12} style={{ color: textSec }} />
                  <span className="text-[11px] font-medium" style={{ color: textMid }}>{label}</span>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}80` }} />
                  <span className="text-[10px] font-bold uppercase" style={{ color: dotColor }}>
                    {s === 'ok' ? 'Online' : s === 'checking' ? '…' : s}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>
    </ControlCentreLayout>
  );
};

export default ControlCentrePage;