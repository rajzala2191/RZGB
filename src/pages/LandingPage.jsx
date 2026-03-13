import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowRight, Shield, Zap, Users, BarChart3, FileCheck, CheckCircle2,
  GitBranch, Globe, Star,
  Eye, Building2, Factory, Wrench, Truck, Award, Package,
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Shared design tokens ──────────────────────────────────────────────────────
const BRAND = '#FF6B35';

function glassCard(isDark) {
  return isDark
    ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 40px rgba(0,0,0,0.3)' }
    : { background: 'var(--surface)', border: '1px solid var(--edge)', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' };
}

function gradientText(colors = `${BRAND} 0%, #fb923c 40%, #8b5cf6 100%`) {
  return { background: `linear-gradient(135deg, ${colors})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };
}

// ─── Decorative components ─────────────────────────────────────────────────────
function GridDotsBackground({ opacity = 0.4 }) {
  const { isDark } = useTheme();
  const dotColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
    </div>
  );
}

function MeshBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="mesh" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={BRAND} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mesh)" />
    </svg>
  );
}

function GradientBlobs({ variant = 'hero' }) {
  const { isDark } = useTheme();
  const o = isDark ? 0.5 : 0.3;

  if (variant === 'cta') return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div animate={{ scale: [1, 1.2, 1], y: [0, -20, 0], opacity: [o, o * 0.7, o] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full"
        style={{ background: `radial-gradient(circle, ${BRAND}22 0%, transparent 70%)` }} />
      <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [o * 0.5, o * 0.3, o * 0.5] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, #3b82f615 0%, transparent 70%)' }} />
    </div>
  );

  if (variant === 'subtle') return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [o * 0.6, o * 0.4, o * 0.6] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
        style={{ background: `radial-gradient(circle, ${BRAND}15 0%, transparent 70%)` }} />
      <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [o * 0.4, o * 0.6, o * 0.4] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, #8b5cf610 0%, transparent 70%)' }} />
    </div>
  );

  // hero variant — 4 orbs
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div animate={{ scale: [1, 1.15, 1], y: [0, -20, 0], opacity: [o, o * 0.7, o] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-15%] right-[-5%] w-[700px] h-[700px] rounded-full"
        style={{ background: `radial-gradient(circle, ${BRAND}22 0%, transparent 70%)` }} />
      <motion.div animate={{ scale: [1.1, 1, 1.1], y: [0, 20, 0], opacity: [o * 0.8, o, o * 0.8] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, #3b82f618 0%, transparent 70%)' }} />
      <motion.div animate={{ scale: [1, 1.2, 1], y: [-10, 10, -10], opacity: [o * 0.5, o * 0.35, o * 0.5] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-[30%] left-[5%] w-[350px] h-[350px] rounded-full"
        style={{ background: 'radial-gradient(circle, #8b5cf612 0%, transparent 70%)' }} />
      <motion.div animate={{ scale: [1.05, 1, 1.05], opacity: [o * 0.4, o * 0.25, o * 0.4] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute top-[-5%] left-[30%] w-[300px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, #10b98110 0%, transparent 70%)' }} />
    </div>
  );
}

// ─── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── Pipeline stages ───────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { label: 'Submit',     color: '#6366f1', icon: Package },
  { label: 'Review',     color: '#f59e0b', icon: Eye },
  { label: 'Bidding',    color: '#8b5cf6', icon: BarChart3 },
  { label: 'Awarded',    color: BRAND,     icon: Award },
  { label: 'Production', color: '#10b981', icon: Wrench },
  { label: 'QC',         color: '#06b6d4', icon: CheckCircle2 },
  { label: 'Delivered',  color: '#22c55e', icon: Truck },
];

const STAGE_DESCRIPTIONS = [
  'Client uploads technical drawings and specifies material, quantity, and delivery requirements. Order enters the RZ intake queue.',
  'Admin reviews the order for completeness, checks drawing quality, and prepares it for AI sanitisation.',
  'Sanitised drawings are released to approved suppliers. The job is open for competitive bids.',
  'A competitive bid set has been received. Admin reviews pricing and lead times before awarding the job.',
  'Job awarded to the winning supplier. Production contract confirmed and delivery timeline locked.',
  'Raw material procurement begins. Supplier updates job milestones visible in real-time.',
  'Parts enter active production. Milestone updates, photos, and NCR reports tracked live.',
];

function MiniPipeline({ activeIdx = 4 }) {
  const inactiveBg     = 'var(--surface-raised)';
  const inactiveBorder = 'var(--edge)';
  const connectorBg    = 'var(--edge)';

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1 scrollbar-none">
      {PIPELINE_STAGES.map((stage, i) => {
        const done   = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={stage.label}>
            <div className="flex flex-col items-center flex-shrink-0">
              <motion.div
                animate={active ? { scale: [1, 1.08, 1], boxShadow: [`0 0 0px ${stage.color}00`, `0 0 16px ${stage.color}66`, `0 0 0px ${stage.color}00`] } : {}}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all"
                style={{ background: done || active ? stage.color : inactiveBg, borderColor: done || active ? stage.color : inactiveBorder }}
              >
                <stage.icon className="w-4 h-4" style={{ color: done || active ? '#fff' : '#94a3b8' }} />
              </motion.div>
              <span className="text-[9px] mt-1.5 font-semibold text-center" style={{ color: active ? stage.color : done ? '#64748b' : '#94a3b8' }}>
                {stage.label}
              </span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className="w-8 h-0.5 flex-shrink-0 mb-4 rounded-full" style={{ background: i < activeIdx ? stage.color : connectorBg }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Role data ─────────────────────────────────────────────────────────────────
const ROLES = {
  client: {
    label: 'Client Portal', color: BRAND, icon: Building2,
    description: 'For manufacturers needing precision parts sourced and tracked end-to-end.',
    steps: [
      { title: 'Submit Your Order',   body: 'Upload technical drawings, specify material, quantity, and delivery requirements.' },
      { title: 'Real-Time Tracking',  body: 'Follow your job through every production stage with live status updates.' },
      { title: 'Receive & Sign Off',  body: 'Get notified on dispatch. Review quality certificates and sign off on delivery.' },
    ],
    path: '/request-demo',
  },
  admin: {
    label: 'Control Centre', color: '#3b82f6', icon: Shield,
    description: 'Full command over the procurement pipeline — from intake through final delivery.',
    steps: [
      { title: 'Sanitise Drawings',   body: 'AI-powered engine strips client identifiers from technical drawings before supplier release.' },
      { title: 'Manage Bidding',      body: 'Review supplier bids, compare pricing and lead times, and award jobs with one click.' },
      { title: 'Monitor Production',  body: 'Real-time pipeline board gives a live view of all active jobs across every stage.' },
    ],
    path: '/request-demo',
  },
  supplier: {
    label: 'Supplier Hub', color: '#8b5cf6', icon: Factory,
    description: 'Manufacturers worldwide compete fairly for jobs with sanitised drawings and transparent bidding.',
    steps: [
      { title: 'Discover New Jobs',   body: 'Browse open jobs matching your specialisms — sanitised drawings protect client IP.' },
      { title: 'Submit Bids',         body: 'Provide competitive pricing and lead times. Bids are reviewed by the RZ admin team.' },
      { title: 'Track Production',    body: 'Update job milestones, upload quality documents, and manage your production pipeline.' },
    ],
    path: '/request-demo',
  },
};

// ─── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { title: 'AI Drawing Sanitisation', body: 'Claude Vision automatically removes client identifiers before drawings reach suppliers. Prevents direct poaching.', icon: Shield,    color: '#3b82f6', visual: 'sanitisation' },
  { title: 'Live Pipeline Board',     body: '11-stage Kanban across all active orders. Admin has full visibility at all times.',                                   icon: GitBranch, color: BRAND,     visual: 'pipeline'     },
  { title: 'Competitive Bidding',     body: 'Suppliers bid on sanitised jobs. Clients get best price. Fair and transparent.',                                      icon: BarChart3, color: '#8b5cf6', visual: 'bidding'      },
  { title: 'Real-Time Tracking',      body: 'WebSocket-powered live updates. Every stage change reflected instantly across all portals.',                          icon: Zap,       color: '#10b981', visual: 'tracking'     },
  { title: 'Document Vault',          body: 'Certificates of conformity, quality reports, shipping documents — all stored per job.',                               icon: FileCheck, color: '#f59e0b', visual: 'documents'    },
  { title: '3-Role Access System',    body: 'Client, Admin, and Supplier portals each with role-specific permissions and views.',                                   icon: Users,     color: '#06b6d4', visual: 'roles'        },
];

const BENTO_LAYOUT = [
  { featureIdx: 0, colSpan: 'md:col-span-7' },
  { featureIdx: 1, colSpan: 'md:col-span-5' },
  { featureIdx: 2, colSpan: 'md:col-span-4' },
  { featureIdx: 3, colSpan: 'md:col-span-4' },
  { featureIdx: 4, colSpan: 'md:col-span-4' },
  { featureIdx: 5, colSpan: 'md:col-span-12' },
];

// ─── Feature visual mockups ────────────────────────────────────────────────────
function FeatureVisual({ type }) {
  const cardBg     = 'var(--surface-raised)';
  const cardBorder = 'var(--edge)';
  const labelColor = 'var(--body)';
  const barBg      = 'var(--edge-strong)';
  const insetBg    = 'var(--surface-inset)';

  if (type === 'sanitisation') {
    return (
      <div className="space-y-3 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-blue-500" />
          <span className="text-[11px] font-bold" style={{ color: labelColor }}>AI Sanitisation Engine</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 relative border" style={{ background: cardBg, borderColor: cardBorder }}>
            <p className="text-[9px] font-bold text-red-400 uppercase mb-2">Before</p>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full w-full"   style={{ background: barBg }} />
              <div className="h-1.5 rounded-full w-3/4"   style={{ background: barBg }} />
              <div className="h-4 rounded px-1 flex items-center mt-2" style={{ background: insetBg, border: '1px solid var(--edge)' }}>
                <span className="text-[8px] text-red-500 font-bold truncate">Thornton Precision Ltd</span>
              </div>
              <div className="h-1.5 rounded-full w-5/6"   style={{ background: barBg }} />
              <div className="h-4 rounded px-1 flex items-center" style={{ background: insetBg, border: '1px solid var(--edge)' }}>
                <span className="text-[8px] text-red-500 font-bold truncate">REF: TP-2024-0891</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl p-3 relative border" style={{ background: cardBg, borderColor: cardBorder }}>
            <p className="text-[9px] font-bold text-emerald-500 uppercase mb-2">After</p>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full w-full"   style={{ background: barBg }} />
              <div className="h-1.5 rounded-full w-3/4"   style={{ background: barBg }} />
              <div className="h-4 rounded px-1 flex items-center mt-2" style={{ background: insetBg, border: '1px solid var(--edge)' }}>
                <span className="text-[8px] text-blue-500 font-bold">██████████████</span>
              </div>
              <div className="h-1.5 rounded-full w-5/6"   style={{ background: barBg }} />
              <div className="h-4 rounded px-1 flex items-center" style={{ background: insetBg, border: '1px solid var(--edge)' }}>
                <span className="text-[8px] text-blue-500 font-bold">██████████████</span>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-emerald-600 font-semibold">3 identifiers removed</span>
        </div>
      </div>
    );
  }

  if (type === 'pipeline') {
    const stages = [
      { label: 'Review',     count: 3, color: '#f59e0b' },
      { label: 'Bidding',    count: 2, color: '#8b5cf6' },
      { label: 'Production', count: 5, color: BRAND },
      { label: 'QC',         count: 1, color: '#10b981' },
    ];
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[11px] font-bold" style={{ color: labelColor }}>Pipeline Board</span>
          </div>
          <span className="text-[10px] font-medium" style={{ color: labelColor }}>11 orders</span>
        </div>
        <div className="flex gap-2">
          {stages.map((s) => (
            <div key={s.label} className="flex-1 rounded-xl overflow-hidden border" style={{ background: cardBg, borderColor: cardBorder, borderTopWidth: 2, borderTopColor: s.color }}>
              <div className="px-2 py-1.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <span className="text-[9px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                <span className="text-[9px] font-bold" style={{ color: labelColor }}>{s.count}</span>
              </div>
              <div className="p-1.5 space-y-1">
                {Array.from({ length: Math.min(s.count, 3) }).map((_, j) => (
                  <div key={j} className="rounded-lg p-1.5" style={{ background: insetBg }}>
                    <div className="h-1 rounded-full w-3/4 mb-1" style={{ background: barBg }} />
                    <div className="h-1 rounded-full w-1/2"      style={{ background: barBg }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'bidding') {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-[11px] font-bold" style={{ color: labelColor }}>Bid Comparison</span>
        </div>
        {[
          { name: 'Sheffield Forge',    price: '£8,400',  lead: '18 days', rating: '4.8★', best: true  },
          { name: 'Midlands Casting',   price: '£9,100',  lead: '14 days', rating: '4.6★', best: false },
          { name: 'Northern Precision', price: '£11,200', lead: '21 days', rating: '4.3★', best: false },
        ].map((bid) => (
          <div key={bid.name} className="flex items-center justify-between p-2.5 rounded-xl border"
            style={{ background: bid.best ? 'rgba(139,92,246,0.12)' : cardBg, borderColor: bid.best ? 'rgba(139,92,246,0.3)' : cardBorder }}>
            <div className="min-w-0">
              <p className="text-[11px] font-bold" style={{ color: bid.best ? '#7c3aed' : 'var(--heading)' }}>{bid.name}</p>
              <p className="text-[9px]" style={{ color: labelColor }}>{bid.lead} · {bid.rating}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-black" style={{ color: bid.best ? '#7c3aed' : 'var(--body)' }}>{bid.price}</span>
              {bid.best && <span className="text-[8px] font-bold bg-violet-500 text-white px-1.5 py-0.5 rounded-full">BEST</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'tracking') {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-bold" style={{ color: labelColor }}>Live Activity Feed</span>
          <span className="ml-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] text-emerald-600 font-semibold">LIVE</span>
          </span>
        </div>
        {[
          { action: 'Order RZ-10033 moved to QC',    time: '2 min ago',  color: '#10b981', icon: CheckCircle2 },
          { action: 'New bid from Sheffield Forge',   time: '5 min ago',  color: '#8b5cf6', icon: BarChart3 },
          { action: 'Drawing sanitised for RZ-10041', time: '12 min ago', color: '#3b82f6', icon: Shield },
          { action: 'RZ-10029 dispatched to client',  time: '1 hr ago',   color: BRAND,     icon: Truck },
        ].map((item, j) => (
          <motion.div key={j} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: j * 0.1 }}
            className="flex items-center gap-2.5 rounded-xl p-2.5 border" style={{ background: cardBg, borderColor: cardBorder }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
              <item.icon className="w-3 h-3" style={{ color: item.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--heading)' }}>{item.action}</p>
              <p className="text-[9px]" style={{ color: labelColor }}>{item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'documents') {
    const docs = [
      { name: 'Certificate of Conformity', ext: 'PDF', color: '#ef4444', size: '1.2 MB' },
      { name: 'Quality Inspection Report', ext: 'PDF', color: '#ef4444', size: '3.4 MB' },
      { name: 'Technical Drawing Rev.3',   ext: 'DWG', color: '#f59e0b', size: '8.1 MB' },
      { name: 'Shipping Manifest',         ext: 'PDF', color: '#ef4444', size: '0.4 MB' },
    ];
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <FileCheck className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-bold" style={{ color: labelColor }}>Document Vault · RZ-10033</span>
        </div>
        {docs.map((doc, j) => (
          <div key={j} className="flex items-center gap-2.5 rounded-xl p-2.5 border" style={{ background: cardBg, borderColor: cardBorder }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${doc.color}12` }}>
              <span className="text-[8px] font-black" style={{ color: doc.color }}>{doc.ext}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--heading)' }}>{doc.name}</p>
              <p className="text-[9px]" style={{ color: labelColor }}>{doc.size}</p>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'roles') {
    const roles = [
      { label: 'Client Portal',  icon: Building2, color: BRAND,     perms: ['Submit orders', 'Track progress', 'Sign off delivery'] },
      { label: 'Control Centre', icon: Shield,    color: '#3b82f6', perms: ['Sanitise drawings', 'Manage bids', 'Full pipeline'] },
      { label: 'Supplier Hub',   icon: Factory,   color: '#8b5cf6', perms: ['Browse jobs', 'Submit bids', 'Update milestones'] },
    ];
    return (
      <div className="w-full space-y-2">
        {roles.map((role) => (
          <div key={role.label} className="rounded-xl p-3 flex items-start gap-3 border" style={{ background: cardBg, borderColor: cardBorder }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${role.color}15` }}>
              <role.icon className="w-4 h-4" style={{ color: role.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold mb-1" style={{ color: role.color }}>{role.label}</p>
              <div className="flex flex-wrap gap-1">
                {role.perms.map((p) => (
                  <span key={p} className="text-[8px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-raised)', color: 'var(--body)' }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ─── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { quote: 'We cut sourcing time by 60% in the first month. The pipeline visibility alone is worth it.',           name: 'James T.',        title: 'Procurement Director',  company: 'Aerospace OEM' },
  { quote: 'The AI sanitisation gives us confidence our IP is protected every time we tender a job.',              name: 'Priya P.',        title: 'Engineering Manager',   company: 'Precision Manufacturer' },
  { quote: 'We went from 3 email chains per order to one platform. Night and day difference.',                     name: 'Oliver W.',       title: 'Operations Lead',       company: 'Industrial Supply Co.' },
  { quote: 'As a supplier, the sanitised drawings are always clean and professional. Bid process is fast.',        name: 'Sheffield Forge', title: 'Managing Director',     company: 'Precision Foundry' },
  { quote: 'The dispatch tracking and document vault eliminated all our post-delivery disputes.',                   name: 'Marcus B.',       title: 'Supply Chain Manager',  company: 'Engineering Works' },
];

// ─── Scroll reveal variants ────────────────────────────────────────────────────
const revealVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

// ─── HeroSection ──────────────────────────────────────────────────────────────
function HeroSection() {
  const { isDark } = useTheme();
  const heroContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
  const heroItem      = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <section className="relative min-h-screen flex items-center pt-16 pb-12 px-4 overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      <GridDotsBackground />
      <GradientBlobs variant="hero" />

      {/* SVG arcs */}
      <svg className="absolute bottom-[10%] left-0 w-full h-40 pointer-events-none opacity-20" viewBox="0 0 1200 100" fill="none" preserveAspectRatio="none">
        <motion.path d="M0 80 Q300 20 600 60 T1200 40" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.8, delay: 0.5 }} />
        <motion.path d="M0 90 Q400 50 800 70 T1200 55" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2.0, delay: 0.9 }} />
        <motion.path d="M0 60 Q200 95 600 45 T1200 65" stroke="#8b5cf6" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.6 }} transition={{ duration: 2.2, delay: 1.2 }} />
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* LEFT: Text column */}
        <motion.div variants={heroContainer} initial="hidden" animate="visible" className="flex flex-col">
          {/* Badge */}
          <motion.div variants={heroItem} className="inline-flex items-center gap-2 self-start rounded-full px-4 py-2 mb-6 text-xs font-bold"
            style={{ background: 'rgba(255,107,53,0.1)', border: `1px solid rgba(255,107,53,0.25)`, color: '#FF6B35' }}>
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            AI-Powered Manufacturing Procurement
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={heroItem} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.04] tracking-tight mb-6" style={{ color: 'var(--heading)' }}>
            The smarter way to{' '}
            <span className="relative inline-block">
              <span style={gradientText(`${BRAND} 0%, #f97316 100%`)}>source parts</span>
              <motion.svg initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.9, duration: 0.7 }}
                className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none">
                <motion.path d="M0 6 Q75 1 150 5 Q225 9 300 4" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </motion.svg>
            </span>{' '}globally
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={heroItem} className="text-base sm:text-lg leading-relaxed mb-8 max-w-lg" style={{ color: 'var(--body)' }}>
            One platform connecting clients, admins, and suppliers across the entire manufacturing lifecycle —
            from order intake to final delivery, with built-in IP protection.
          </motion.p>

          {/* CTA row */}
          <motion.div variants={heroItem} className="flex flex-col sm:flex-row flex-wrap gap-3 mb-8">
            {[
              { label: 'Client Demo',   color: BRAND,     icon: Building2, shadow: BRAND },
              { label: 'Admin Demo',    color: '#3b82f6', icon: Shield,    shadow: '#3b82f6' },
              { label: 'Supplier Demo', color: '#8b5cf6', icon: Factory,   shadow: '#8b5cf6' },
            ].map((btn) => (
              <motion.div key={btn.label} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link to="/request-demo"
                  className="flex items-center justify-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-xl transition-shadow"
                  style={{ background: btn.color, boxShadow: `0 6px 20px ${btn.shadow}35` }}>
                  <btn.icon className="w-4 h-4" /> {btn.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={heroItem} className="flex items-center gap-4 flex-wrap">
            {['IP Protected', 'AI Powered', 'Live Tracking', 'SOC-2 Ready'].map((badge, i) => (
              <React.Fragment key={badge}>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--body)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {badge}
                </span>
                {i < 3 && <span className="text-xs" style={{ color: 'var(--edge-strong)' }}>·</span>}
              </React.Fragment>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT: Floating card cluster */}
        <motion.div
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:block"
        >
          {/* Primary glass card */}
          <div className="relative rounded-2xl p-6 backdrop-blur-xl" style={{
            ...glassCard(isDark),
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--body)' }}>RZ-JOB-10033 · Valve Body Casting</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--heading)' }}>Bronze LG2 · 60 pieces</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                Casting Stage
              </span>
            </div>
            <MiniPipeline activeIdx={4} />
            <div className="mt-4 pt-4 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--edge)', color: 'var(--body)' }}>
              <span>Sheffield Forge · Awarded</span>
              <span className="font-semibold" style={{ color: '#10b981' }}>£9,100</span>
            </div>
          </div>

          {/* Floating badge: top-right */}
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
            className="absolute -top-4 -right-6 backdrop-blur-md rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold"
            style={{ ...glassCard(isDark), color: 'var(--heading)' }}>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Tracking
          </motion.div>

          {/* Floating badge: bottom-left */}
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-4 -left-6 backdrop-blur-md rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-blue-400"
            style={{ ...glassCard(isDark) }}>
            <Shield className="w-3.5 h-3.5" /> IP Protected
          </motion.div>

          {/* Floating badge: mid-left */}
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.9, ease: 'easeInOut', delay: 1 }}
            className="absolute top-8 -left-8 backdrop-blur-md rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold"
            style={{ ...glassCard(isDark), color: '#8b5cf6' }}>
            <BarChart3 className="w-3.5 h-3.5" /> 3 Bids Received
          </motion.div>

          {/* Connector SVG lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" fill="none">
            <line x1="85%" y1="5%" x2="70%" y2="20%" stroke={BRAND} strokeWidth="1" strokeDasharray="4 4" />
            <line x1="5%" y1="80%" x2="20%" y2="65%" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="2%" y1="30%" x2="20%" y2="40%" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}

// ─── StatsBar ──────────────────────────────────────────────────────────────────
function StatsBar() {
  const { isDark } = useTheme();
  const stats = [
    { label: 'Orders Processed',    value: 340, suffix: '+', color: BRAND,     colorLight: '#fb923c', icon: Package },
    { label: 'On-Time Delivery',    value: 98,  suffix: '%', color: '#10b981', colorLight: '#34d399', icon: CheckCircle2 },
    { label: 'Active Suppliers',    value: 47,  suffix: '',  color: '#8b5cf6', colorLight: '#a78bfa', icon: Factory },
    { label: 'Portals in One',      value: 3,   suffix: '',  color: '#3b82f6', colorLight: '#60a5fa', icon: Shield },
  ];

  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--surface)', borderTop: '1px solid var(--edge)', borderBottom: '1px solid var(--edge)' }}>
      <GridDotsBackground />
      <div className="relative max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x" style={{ '--tw-divide-opacity': 1, '--tw-divide-color': 'var(--edge)' }}>
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
            className="text-center py-10 px-6"
          >
            <p className="text-5xl font-black mb-2 tabular-nums" style={gradientText(`${s.color} 0%, ${s.colorLight} 100%`)}>
              <Counter target={s.value} suffix={s.suffix} />
            </p>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--body)' }}>{s.label}</p>
            <s.icon className="w-4 h-4 mx-auto opacity-40" style={{ color: s.color }} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── FeaturesSection (Bento Grid) ─────────────────────────────────────────────
function FeaturesSection() {
  const { isDark } = useTheme();

  return (
    <section id="features" className="relative py-20 sm:py-28 px-4 overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      <GridDotsBackground />
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: BRAND }}>Platform Features</p>
          <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ color: 'var(--heading)' }}>
            Everything you need,{' '}
            <span style={gradientText()}>in one place</span>
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--body)' }}>
            Built specifically for manufacturing procurement — not a generic tool adapted for manufacturing.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {BENTO_LAYOUT.map((item, i) => {
            const f = FEATURES[item.featureIdx];
            const isWide = item.colSpan === 'md:col-span-12';

            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
                whileHover={{ scale: 1.015, y: -4, transition: { duration: 0.2 } }}
                className={`${item.colSpan} relative rounded-2xl p-6 sm:p-8 overflow-hidden group cursor-default backdrop-blur-xl`}
                style={{ ...glassCard(isDark) }}
              >
                {/* Corner accent orb */}
                <div className="absolute top-0 left-0 w-40 h-40 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${f.color}12 0%, transparent 70%)`, transform: 'translate(-30%, -30%)' }} />

                {isWide ? (
                  /* Wide card: horizontal layout */
                  <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}15`, border: `1px solid ${f.color}20` }}>
                        <f.icon className="w-5 h-5" style={{ color: f.color }} />
                      </div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--heading)' }}>{f.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>{f.body}</p>
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <FeatureVisual type={f.visual} />
                    </div>
                  </div>
                ) : (
                  /* Standard card: vertical layout */
                  <>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 relative z-10" style={{ background: `${f.color}15`, border: `1px solid ${f.color}20` }}>
                      <f.icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 relative z-10" style={{ color: 'var(--heading)' }}>{f.title}</h3>
                    <p className="text-sm leading-relaxed mb-5 relative z-10" style={{ color: 'var(--body)' }}>{f.body}</p>
                    <div className="relative z-10">
                      <FeatureVisual type={f.visual} />
                    </div>
                  </>
                )}

                {/* Bottom hover accent line */}
                <div className="absolute bottom-0 right-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
                  style={{ background: `linear-gradient(to left, ${f.color}, transparent)` }} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── RoleTabsSection ──────────────────────────────────────────────────────────
function RoleTabsSection() {
  const { isDark } = useTheme();
  const [active, setActive] = useState('client');
  const role = ROLES[active];

  return (
    <section id="portals" className="relative py-20 sm:py-28 px-4 overflow-hidden" style={{ background: 'var(--surface)' }}>
      {/* Subtle diagonal accent */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ background: `linear-gradient(135deg, ${BRAND} 0%, transparent 50%, #3b82f6 100%)` }} />
      <GridDotsBackground />

      <div className="relative max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: BRAND }}>Three Portals, One System</p>
          <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ color: 'var(--heading)' }}>
            A dedicated portal for{' '}
            <span style={gradientText()}>every role</span>
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--body)' }}>Each portal is purpose-built — not just the same dashboard with hidden buttons.</p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-2xl p-1.5 gap-1 backdrop-blur-xl" style={{ ...glassCard(isDark) }}>
            {Object.entries(ROLES).map(([key, r]) => (
              <button key={key} onClick={() => setActive(key)}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all"
                style={active === key
                  ? { background: `linear-gradient(135deg, ${r.color}, ${r.color}cc)`, color: '#fff', boxShadow: `0 4px 20px ${r.color}40` }
                  : { color: 'var(--body)' }
                }>
                <r.icon className="w-4 h-4" />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="grid md:grid-cols-2 gap-6 md:gap-10 items-start"
          >
            {/* Steps column */}
            <div>
              <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--body)' }}>{role.description}</p>
              <div className="relative space-y-5">
                {/* Vertical connector SVG */}
                <svg className="absolute left-4 top-0 w-0.5 pointer-events-none" style={{ height: '100%', stroke: `${role.color}25`, strokeDasharray: '4 4' }}>
                  <line x1="0" y1="0" x2="0" y2="100%" strokeWidth="1" />
                </svg>
                {role.steps.map((step, i) => (
                  <motion.div key={i} className="flex gap-4 relative z-10"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                      style={{ background: role.color, boxShadow: `0 4px 12px ${role.color}40` }}>
                      {i + 1}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--heading)' }}>{step.title}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>{step.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8">
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Link to={role.path} className="inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all"
                    style={{ background: role.color, boxShadow: `0 4px 20px ${role.color}45` }}>
                    Try {role.label} <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Portal mockup card */}
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm"
              style={{ ...glassCard(isDark), borderTop: `4px solid ${role.color}` }}>
              {/* Colored header */}
              <div className="px-4 py-2.5 flex items-center gap-2"
                style={{ background: `linear-gradient(to right, ${role.color}12, transparent)`, borderBottom: '1px solid var(--edge)' }}>
                <role.icon className="w-4 h-4" style={{ color: role.color }} />
                <span className="text-xs font-bold" style={{ color: role.color }}>{role.label}</span>
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: role.color }} />
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--caption)' }}>Live</span>
                </span>
              </div>
              <div className="flex">
                <div className="w-14 flex flex-col items-center py-4 gap-3 border-r" style={{ background: 'var(--surface-raised)', borderColor: 'var(--edge)' }}>
                  {[BarChart3, Package, FileCheck, Users].map((Icon, j) => (
                    <div key={j} className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={j === 0 ? { background: role.color, color: '#fff' } : { color: 'var(--body)' }}>
                      <Icon className="w-4 h-4" />
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4 min-h-[220px]">
                  <div className="space-y-2 mb-4">
                    {[80, 60, 70, 50].map((w, j) => <div key={j} className="h-2 rounded-full" style={{ width: `${w}%`, background: 'var(--edge-strong)' }} />)}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['12', '4', '8'].map((n, j) => (
                      <div key={j} className="rounded-lg p-2 text-center" style={{ background: 'var(--surface-raised)' }}>
                        <p className="text-base font-black" style={{ color: 'var(--heading)' }}>{n}</p>
                        <div className="h-1.5 rounded-full mt-1 w-10 mx-auto" style={{ background: 'var(--edge-strong)' }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center gap-2 rounded-lg p-2" style={{ background: 'var(--surface-inset)' }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: role.color }} />
                        <div className="h-1.5 rounded-full flex-1" style={{ background: 'var(--edge-strong)' }} />
                        <div className="h-4 w-12 rounded-full" style={{ background: 'var(--edge-strong)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── PipelineSection ──────────────────────────────────────────────────────────
function PipelineSection() {
  const { isDark } = useTheme();
  const [activeIdx, setActiveIdx] = useState(4);
  const [userSelected, setUserSelected] = useState(false);

  useEffect(() => {
    if (userSelected) return;
    const interval = setInterval(() => setActiveIdx((i) => (i + 1) % PIPELINE_STAGES.length), 2000);
    return () => clearInterval(interval);
  }, [userSelected]);

  const handleStageClick = (i) => {
    setActiveIdx(i);
    setUserSelected(true);
  };

  const stage = PIPELINE_STAGES[activeIdx];

  const pipelineHighlights = [
    { label: 'Auto-scrubbed drawings', icon: Shield,    color: '#3b82f6' },
    { label: 'Competitive bidding',    icon: BarChart3, color: '#8b5cf6' },
    { label: 'Real-time updates',      icon: Zap,       color: BRAND },
    { label: 'Quality certificates',   icon: FileCheck, color: '#10b981' },
  ];

  return (
    <section className="relative py-20 sm:py-28 px-4 overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      <GridDotsBackground />
      <div className="relative max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: BRAND }}>Order Lifecycle</p>
          <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ color: 'var(--heading)' }}>
            From drawing to delivery,{' '}
            <span style={gradientText(`${BRAND} 0%, #10b981 100%`)}>fully tracked</span>
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--body)' }}>
            Every order moves through a defined 7-stage pipeline. Nothing gets lost, nothing gets overlooked.
          </p>
        </motion.div>

        {/* Stage rail */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-2xl p-6 sm:p-8 backdrop-blur-xl mb-4" style={{ ...glassCard(isDark) }}>
          <div className="flex items-start justify-between gap-1 overflow-x-auto pb-2 scrollbar-none">
            {PIPELINE_STAGES.map((s, i) => {
              const done   = i < activeIdx;
              const active = i === activeIdx;
              return (
                <React.Fragment key={s.label}>
                  <button onClick={() => handleStageClick(i)} className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer" title={s.label}>
                    <motion.div
                      animate={active ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [`0 0 0px ${s.color}00`, `0 0 24px ${s.color}66`, `0 0 0px ${s.color}00`],
                      } : {}}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                      whileHover={{ scale: 1.1 }}
                      className="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all"
                      style={{
                        background:  done || active ? s.color : 'var(--surface-raised)',
                        borderColor: done || active ? s.color : 'var(--edge)',
                      }}
                    >
                      <s.icon className="w-5 h-5" style={{ color: done || active ? '#fff' : '#94a3b8' }} />
                    </motion.div>
                    <span className="text-[10px] font-semibold text-center w-14" style={{ color: active ? s.color : done ? 'var(--body)' : 'var(--caption)' }}>
                      {s.label}
                    </span>
                    {active && (
                      <motion.span layoutId="stageDot" className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    )}
                  </button>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div className="flex-1 h-0.5 mt-6 rounded-full flex-shrink min-w-[16px] transition-all duration-500"
                      style={{ background: i < activeIdx ? s.color : 'var(--edge)' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        {/* Stage description panel */}
        <AnimatePresence mode="wait">
          <motion.div key={activeIdx}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            className="rounded-2xl p-5 mb-6 backdrop-blur-xl"
            style={{ background: 'var(--surface)', border: `1px solid ${stage.color}30`, boxShadow: `0 0 40px ${stage.color}0a` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${stage.color}15` }}>
                <stage.icon className="w-5 h-5" style={{ color: stage.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--heading)' }}>{stage.label}</p>
                <p className="text-xs" style={{ color: stage.color }}>Stage {activeIdx + 1} of {PIPELINE_STAGES.length}</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0"
                style={{ background: `${stage.color}12`, color: stage.color, border: `1px solid ${stage.color}25` }}>
                {userSelected ? 'Selected' : 'Auto'}
              </span>
            </div>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--body)' }}>
              {STAGE_DESCRIPTIONS[activeIdx]}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pipelineHighlights.map((item, j) => (
            <motion.div key={item.label}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: j * 0.08 }}
              whileHover={{ y: -2 }}
              className="flex items-center gap-3 rounded-xl p-4 backdrop-blur-sm"
              style={{ ...glassCard(isDark) }}>
              <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: item.color }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--heading)' }}>{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TestimonialsSection ───────────────────────────────────────────────────────
function TestimonialsSection() {
  const { isDark } = useTheme();

  const TestimonialCard = ({ t }) => (
    <div className="w-[320px] sm:w-[360px] flex-shrink-0 rounded-2xl p-6 relative backdrop-blur-md" style={{ ...glassCard(isDark) }}>
      {/* Gradient stars */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className="w-4 h-4" style={{ fill: `hsl(${30 + s * 5}, 90%, 55%)`, color: `hsl(${30 + s * 5}, 90%, 55%)` }} />
        ))}
      </div>
      <p className="text-sm leading-relaxed mb-5 italic" style={{ color: 'var(--body)' }}>"{t.quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${BRAND}, #8b5cf6)` }}>
          {t.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: 'var(--heading)' }}>{t.name}</p>
          <p className="text-[11px]" style={{ color: 'var(--caption)' }}>{t.title} · {t.company}</p>
        </div>
      </div>
      {/* Corner quote mark */}
      <div className="absolute top-4 right-5 text-4xl font-serif leading-none opacity-[0.07]" style={{ color: 'var(--heading)' }}>"</div>
    </div>
  );

  const sectionBg = 'var(--surface-raised)';
  const fadeLeft  = `linear-gradient(to right, ${sectionBg}, transparent)`;
  const fadeRight = `linear-gradient(to left,  ${sectionBg}, transparent)`;

  return (
    <section className="relative py-20 overflow-hidden" style={{ background: sectionBg }}>
      <GridDotsBackground />
      <div className="relative text-center mb-10 px-4">
        <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: BRAND }}>What People Say</p>
        <h2 className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--heading)' }}>Trusted by manufacturers worldwide</h2>
      </div>

      {/* Row 1: scrolls left */}
      <div className="relative overflow-hidden mb-4">
        <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="flex gap-4 w-max">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => <TestimonialCard key={i} t={t} />)}
        </motion.div>
        <div className="absolute left-0 top-0 bottom-0 w-32 pointer-events-none z-10" style={{ background: fadeLeft }} />
        <div className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none z-10" style={{ background: fadeRight }} />
      </div>

      {/* Row 2: scrolls right */}
      <div className="relative overflow-hidden">
        <motion.div animate={{ x: ['-50%', '0%'] }} transition={{ duration: 36, repeat: Infinity, ease: 'linear' }} className="flex gap-4 w-max">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => <TestimonialCard key={i} t={t} />)}
        </motion.div>
        <div className="absolute left-0 top-0 bottom-0 w-32 pointer-events-none z-10" style={{ background: fadeLeft }} />
        <div className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none z-10" style={{ background: fadeRight }} />
      </div>
    </section>
  );
}

// ─── CTASection ───────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 px-4 overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      {/* Radial gradient background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,107,53,0.18) 0%, var(--app-bg) 70%)` }} />
      <MeshBackground />
      <GradientBlobs variant="cta" />
      {/* Top border line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${BRAND}, transparent)` }} />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8"
            style={{ background: 'rgba(255,107,53,0.1)', border: `1px solid rgba(255,107,53,0.25)` }}>
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold" style={{ color: BRAND }}>Start Today — No Credit Card Required</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-6 leading-[1.05]" style={{ color: 'var(--heading)' }}>
            Ready to modernise your{' '}
            <br className="hidden sm:block" />
            <span style={gradientText(`${BRAND} 0%, #fb923c 40%, #f59e0b 100%`)}>manufacturing procurement?</span>
          </h2>

          <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: 'var(--body)' }}>
            Request demo access and we'll email you a link. Once approved, explore all three portals with sample data.
          </p>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            {[
              { label: 'Client Demo',   color: BRAND,     icon: Building2 },
              { label: 'Admin Demo',    color: '#3b82f6', icon: Shield },
              { label: 'Supplier Demo', color: '#8b5cf6', icon: Factory },
            ].map((btn) => (
              <motion.div key={btn.label} whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}>
                <Link to="/request-demo"
                  className="flex items-center justify-center gap-2.5 text-white text-sm font-bold px-8 py-4 rounded-xl"
                  style={{ background: btn.color, boxShadow: `0 8px 30px ${btn.color}40` }}>
                  <btn.icon className="w-4 h-4" /> {btn.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-xs mt-8" style={{ color: 'var(--caption)' }}>5 sample clients · 5 sample suppliers · Orders across all 11 stages</p>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-4">
            <Link to="/pricing" className="text-sm font-semibold underline underline-offset-2 transition-colors" style={{ color: BRAND }}>
              View pricing
            </Link>
            {' '}<span style={{ color: 'var(--body)' }}>· Starter, Growth &amp; Enterprise plans</span>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function LandingFooter() {
  const { isDark } = useTheme();
  const year = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'Features',     to: '/landing' },
        { label: 'How It Works', to: '/how-it-works' },
        { label: 'Pricing',      to: '/pricing' },
        { label: 'Request Demo', to: '/request-demo' },
        { label: 'Roadmap',      to: '/roadmap' },
      ],
    },
    {
      title: 'Portals',
      links: [
        { label: 'Client Portal',  to: '/request-demo' },
        { label: 'Control Centre', to: '/request-demo' },
        { label: 'Supplier Hub',   to: '/request-demo' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About RZ',      to: '/landing' },
        { label: 'Contact',       to: '/request-demo' },
        { label: 'Privacy Policy',to: '/landing' },
        { label: 'Terms',         to: '/landing' },
      ],
    },
  ];

  return (
    <footer className="py-12 px-4" style={{ background: 'var(--app-bg)', borderTop: '1px solid var(--edge)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/zaproc-logo-192.png" alt="Zaproc" className="h-8 object-contain"
                style={isDark ? { filter: 'brightness(0) invert(1)', opacity: 0.85 } : {}} />
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--body)' }}>
              B2B manufacturing procurement platform for global industry. Three portals, one system.
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--caption)' }}>
              <Globe className="w-3.5 h-3.5" style={{ color: BRAND }} />
              Global Platform · UK Based
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--heading)' }}>{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-xs transition-colors hover:opacity-80" style={{ color: 'var(--body)' }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: '1px solid var(--edge)' }}>
          <p className="text-xs" style={{ color: 'var(--caption)' }}>
            © {year} RZ Global Solutions Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${BRAND}10`, color: BRAND, border: `1px solid ${BRAND}20` }}>
              Zaproc Platform
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      <PublicNav activePage="landing" />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <RoleTabsSection />
      <PipelineSection />
      <TestimonialsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
