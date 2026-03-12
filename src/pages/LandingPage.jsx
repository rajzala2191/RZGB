import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowRight, Shield, Zap, Users, BarChart3, FileCheck, CheckCircle2,
  GitBranch, Globe, Menu, X, Star,
  Eye, Building2, Factory, Wrench, Truck, Award, Package, Play,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Decorative backgrounds (theme-aware) ─────────────────────────────────────
function GridDotsBackground({ opacity = 0.4, className = '' }) {
  const { isDark } = useTheme();
  const dotColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }} />
    </div>
  );
}

function GradientBlobs({ className = '' }) {
  const { isDark } = useTheme();
  const o = isDark ? 0.5 : 0.35;
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [o, o * 0.8, o] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-15%] right-[-5%] w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, #FF6B3520 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [o * 0.9, o, o * 0.9] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, #3b82f615 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [o * 0.6, o * 0.4, o * 0.6] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[30%] left-[10%] w-[300px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, #8b5cf610 0%, transparent 70%)' }}
      />
    </div>
  );
}

// ─── Animated counter ────────────────────────────────────────────────────────
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

// ─── Pipeline stages ──────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { label: 'Submit',     color: '#6366f1', icon: Package },
  { label: 'Review',     color: '#f59e0b', icon: Eye },
  { label: 'Bidding',    color: '#8b5cf6', icon: BarChart3 },
  { label: 'Awarded',    color: '#FF6B35', icon: Award },
  { label: 'Production', color: '#10b981', icon: Wrench },
  { label: 'QC',         color: '#06b6d4', icon: CheckCircle2 },
  { label: 'Delivered',  color: '#22c55e', icon: Truck },
];

function MiniPipeline({ activeIdx = 4 }) {
  const { isDark } = useTheme();
  const inactiveBg     = isDark ? 'var(--surface-raised)' : '#f1f5f9';
  const inactiveBorder = isDark ? 'var(--edge)'           : '#e2e8f0';
  const connectorBg    = isDark ? 'var(--edge)'           : '#e2e8f0';

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1 scrollbar-none">
      {PIPELINE_STAGES.map((stage, i) => {
        const done   = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={stage.label}>
            <div className="flex flex-col items-center flex-shrink-0">
              <motion.div
                animate={active ? {
                  scale: [1, 1.08, 1],
                  boxShadow: [`0 0 0px ${stage.color}00`, `0 0 16px ${stage.color}66`, `0 0 0px ${stage.color}00`],
                } : {}}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all"
                style={{
                  background:   done || active ? stage.color : inactiveBg,
                  borderColor:  done || active ? stage.color : inactiveBorder,
                }}
              >
                <stage.icon className="w-4 h-4" style={{ color: done || active ? '#fff' : '#94a3b8' }} />
              </motion.div>
              <span
                className="text-[9px] mt-1.5 font-semibold text-center"
                style={{ color: active ? stage.color : done ? '#64748b' : '#94a3b8' }}
              >
                {stage.label}
              </span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div
                className="w-8 h-0.5 flex-shrink-0 mb-4 rounded-full"
                style={{ background: i < activeIdx ? stage.color : connectorBg }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Role data ────────────────────────────────────────────────────────────────
const ROLES = {
  client: {
    label: 'Client Portal',
    color: '#FF6B35',
    icon: Building2,
    description: 'For manufacturers needing precision parts sourced and tracked end-to-end.',
    steps: [
      { title: 'Submit Your Order',   body: 'Upload technical drawings, specify material, quantity, and delivery requirements.' },
      { title: 'Real-Time Tracking',  body: 'Follow your job through every production stage with live status updates.' },
      { title: 'Receive & Sign Off',  body: 'Get notified on dispatch. Review quality certificates and sign off on delivery.' },
    ],
    path: '/demo?role=client',
  },
  admin: {
    label: 'Control Centre',
    color: '#3b82f6',
    icon: Shield,
    description: 'Full command over the procurement pipeline — from intake through final delivery.',
    steps: [
      { title: 'Sanitise Drawings',   body: 'AI-powered engine strips client identifiers from technical drawings before supplier release.' },
      { title: 'Manage Bidding',      body: 'Review supplier bids, compare pricing and lead times, and award jobs with one click.' },
      { title: 'Monitor Production',  body: 'Real-time pipeline board gives a live view of all active jobs across every stage.' },
    ],
    path: '/demo?role=admin',
  },
  supplier: {
    label: 'Supplier Hub',
    color: '#8b5cf6',
    icon: Factory,
    description: 'Manufacturers worldwide compete fairly for jobs with sanitised drawings and transparent bidding.',
    steps: [
      { title: 'Discover New Jobs',   body: 'Browse open jobs matching your specialisms — sanitised drawings protect client IP.' },
      { title: 'Submit Bids',         body: 'Provide competitive pricing and lead times. Bids are reviewed by the RZ admin team.' },
      { title: 'Track Production',    body: 'Update job milestones, upload quality documents, and manage your production pipeline.' },
    ],
    path: '/demo?role=supplier',
  },
};

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { title: 'AI Drawing Sanitisation', body: 'Claude Vision automatically removes client identifiers before drawings reach suppliers. Prevents direct poaching.', icon: Shield,    color: '#3b82f6', visual: 'sanitisation' },
  { title: 'Live Pipeline Board',     body: '11-stage Kanban across all active orders. Admin has full visibility at all times.',                                   icon: GitBranch, color: '#FF6B35', visual: 'pipeline'     },
  { title: 'Competitive Bidding',     body: 'Suppliers bid on sanitised jobs. Clients get best price. Fair and transparent.',                                      icon: BarChart3,  color: '#8b5cf6', visual: 'bidding'      },
  { title: 'Real-Time Tracking',      body: 'WebSocket-powered live updates. Every stage change reflected instantly across all portals.',                          icon: Zap,        color: '#10b981', visual: 'tracking'     },
  { title: 'Document Vault',          body: 'Certificates of conformity, quality reports, shipping documents — all stored per job.',                               icon: FileCheck,  color: '#f59e0b', visual: 'documents'    },
  { title: '3-Role Access System',    body: 'Client, Admin, and Supplier portals each with role-specific permissions and views.',                                   icon: Users,      color: '#06b6d4', visual: 'roles'        },
];

function FeatureVisual({ type }) {
  const { isDark } = useTheme();
  const cardBg     = isDark ? 'var(--surface-raised)' : '#ffffff';
  const cardBorder = isDark ? 'var(--edge)'           : '#e2e8f0';
  const labelColor = isDark ? 'var(--body)'           : '#475569';
  const barBg      = isDark ? 'var(--edge-strong)'    : '#e2e8f0';

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
              <div className="h-4 bg-red-100 border border-red-200 rounded px-1 flex items-center mt-2">
                <span className="text-[8px] text-red-500 font-bold truncate">Thornton Precision Ltd</span>
              </div>
              <div className="h-1.5 rounded-full w-5/6"   style={{ background: barBg }} />
              <div className="h-4 bg-red-100 border border-red-200 rounded px-1 flex items-center">
                <span className="text-[8px] text-red-500 font-bold truncate">REF: TP-2024-0891</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl p-3 relative border border-blue-200" style={{ background: cardBg }}>
            <p className="text-[9px] font-bold text-emerald-500 uppercase mb-2">After</p>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full w-full"   style={{ background: barBg }} />
              <div className="h-1.5 rounded-full w-3/4"   style={{ background: barBg }} />
              <div className="h-4 bg-blue-50 border border-blue-200 rounded px-1 flex items-center mt-2">
                <span className="text-[8px] text-blue-500 font-bold">██████████████</span>
              </div>
              <div className="h-1.5 rounded-full w-5/6"   style={{ background: barBg }} />
              <div className="h-4 bg-blue-50 border border-blue-200 rounded px-1 flex items-center">
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
      { label: 'Production', count: 5, color: '#FF6B35' },
      { label: 'QC',         count: 1, color: '#10b981' },
    ];
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[11px] font-bold" style={{ color: labelColor }}>Pipeline Board</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">11 orders</span>
        </div>
        <div className="flex gap-2">
          {stages.map((s) => (
            <div key={s.label} className="flex-1 rounded-xl overflow-hidden border" style={{ background: cardBg, borderColor: cardBorder, borderTopWidth: 2, borderTopColor: s.color }}>
              <div className="px-2 py-1.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <span className="text-[9px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                <span className="text-[9px] text-slate-400 font-bold">{s.count}</span>
              </div>
              <div className="p-1.5 space-y-1">
                {Array.from({ length: Math.min(s.count, 3) }).map((_, j) => (
                  <div key={j} className="rounded-lg p-1.5" style={{ background: isDark ? 'var(--surface-inset)' : '#f8fafc' }}>
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
          { name: 'Sheffield Forge',   price: '£8,400',  lead: '18 days', rating: '4.8★', best: true  },
          { name: 'Midlands Casting',  price: '£9,100',  lead: '14 days', rating: '4.6★', best: false },
          { name: 'Northern Precision',price: '£11,200', lead: '21 days', rating: '4.3★', best: false },
        ].map((bid) => (
          <div
            key={bid.name}
            className="flex items-center justify-between p-2.5 rounded-xl border"
            style={{
              background:   bid.best ? (isDark ? 'rgba(139,92,246,0.12)' : '#f5f3ff') : cardBg,
              borderColor:  bid.best ? (isDark ? 'rgba(139,92,246,0.3)' : '#ddd6fe') : cardBorder,
            }}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-bold" style={{ color: bid.best ? '#7c3aed' : isDark ? 'var(--heading)' : '#374151' }}>{bid.name}</p>
              <p className="text-[9px] text-slate-400">{bid.lead} · {bid.rating}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-black" style={{ color: bid.best ? '#7c3aed' : isDark ? 'var(--body)' : '#374151' }}>{bid.price}</span>
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
          { action: 'Order RZ-10033 moved to QC',        time: '2 min ago',  color: '#10b981', icon: CheckCircle2 },
          { action: 'New bid from Sheffield Forge',       time: '5 min ago',  color: '#8b5cf6', icon: BarChart3 },
          { action: 'Drawing sanitised for RZ-10041',     time: '12 min ago', color: '#3b82f6', icon: Shield },
          { action: 'RZ-10029 dispatched to client',      time: '1 hr ago',   color: '#FF6B35', icon: Truck },
        ].map((item, j) => (
          <motion.div
            key={j}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: j * 0.1 }}
            className="flex items-center gap-2.5 rounded-xl p-2.5 border"
            style={{ background: cardBg, borderColor: cardBorder }}
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
              <item.icon className="w-3 h-3" style={{ color: item.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold truncate" style={{ color: isDark ? 'var(--heading)' : '#374151' }}>{item.action}</p>
              <p className="text-[9px] text-slate-400">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'documents') {
    const docs = [
      { name: 'Certificate of Conformity',   ext: 'PDF', color: '#ef4444', size: '1.2 MB' },
      { name: 'Quality Inspection Report',   ext: 'PDF', color: '#ef4444', size: '3.4 MB' },
      { name: 'Technical Drawing Rev.3',     ext: 'DWG', color: '#f59e0b', size: '8.1 MB' },
      { name: 'Shipping Manifest',           ext: 'PDF', color: '#ef4444', size: '0.4 MB' },
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
              <p className="text-[10px] font-semibold truncate" style={{ color: isDark ? 'var(--heading)' : '#374151' }}>{doc.name}</p>
              <p className="text-[9px] text-slate-400">{doc.size}</p>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'roles') {
    const roles = [
      { label: 'Client Portal',   icon: Building2, color: '#FF6B35', perms: ['Submit orders', 'Track progress', 'Sign off delivery'] },
      { label: 'Control Centre',  icon: Shield,    color: '#3b82f6', perms: ['Sanitise drawings', 'Manage bids', 'Full pipeline'] },
      { label: 'Supplier Hub',    icon: Factory,   color: '#8b5cf6', perms: ['Browse jobs', 'Submit bids', 'Update milestones'] },
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
                  <span key={p} className="text-[8px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: isDark ? 'var(--surface-raised)' : '#f1f5f9', color: isDark ? 'var(--body)' : '#64748b' }}>{p}</span>
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

// ─── Testimonials data ────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { quote: 'We cut sourcing time by 60% in the first month. The pipeline visibility alone is worth it.',             name: 'James T.',       title: 'Procurement Director',   company: 'Aerospace OEM' },
  { quote: 'The AI sanitisation gives us confidence our IP is protected every time we tender a job.',                name: 'Priya P.',       title: 'Engineering Manager',    company: 'Precision Manufacturer' },
  { quote: 'We went from 3 email chains per order to one platform. Night and day difference.',                       name: 'Oliver W.',      title: 'Operations Lead',        company: 'Industrial Supply Co.' },
  { quote: 'As a supplier, the sanitised drawings are always clean and professional. Bid process is fast.',          name: 'Sheffield Forge',title: 'Managing Director',      company: 'Precision Foundry' },
  { quote: 'The dispatch tracking and document vault eliminated all our post-delivery disputes.',                    name: 'Marcus B.',      title: 'Supply Chain Manager',   company: 'Engineering Works' },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────
function LandingNav() {
  const { isDark } = useTheme();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-xl"
      style={scrolled ? {
        background:   'var(--header-bg)',
        borderBottom: '1px solid var(--header-border)',
        boxShadow:    '0 1px 3px rgba(0,0,0,0.06)',
      } : { background: 'transparent' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/light-logo.png"
            alt="RZ"
            className="h-8 object-contain transition-all"
            style={isDark ? { filter: 'brightness(0) invert(1)', opacity: 0.9 } : {}}
          />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 hidden sm:block">RZ Global Solutions</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('features')}  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors">Features</button>
          <Link   to="/how-it-works"                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors">How it Works</Link>
          <Link   to="/pricing"                         className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors">Pricing</Link>
          <button onClick={() => scrollTo('portals')}   className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors">Portals</button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login" className="hidden sm:block text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors">Sign In</Link>
          <Link
            to="/demo"
            className="flex items-center gap-2 bg-[#FF6B35] hover:bg-orange-500 active:scale-[0.97] text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/40"
          >
            Try Demo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1" aria-label="Toggle menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden px-4 pb-4 pt-2 space-y-2 overflow-hidden"
            style={{ background: 'var(--header-bg)', borderTop: '1px solid var(--header-border)' }}
          >
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
            <button onClick={() => scrollTo('features')} className="block py-2 text-sm text-slate-600 dark:text-slate-400 font-medium w-full text-left">Features</button>
            <Link   to="/how-it-works"                   className="block py-2 text-sm text-slate-600 dark:text-slate-400 font-medium">How it Works</Link>
            <Link   to="/pricing"                        className="block py-2 text-sm text-slate-600 dark:text-slate-400 font-medium">Pricing</Link>
            <button onClick={() => scrollTo('portals')}  className="block py-2 text-sm text-slate-600 dark:text-slate-400 font-medium w-full text-left">Portals</button>
            <Link   to="/login"                          className="block py-2 text-sm text-slate-600 dark:text-slate-400 font-medium">Sign In</Link>
            <Link   to="/demo"                           className="block py-2 text-sm text-[#FF6B35] font-bold">Try Demo →</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const { isDark } = useTheme();
  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const itemVariants = {
    hidden:   { opacity: 0, y: 28 },
    visible:  { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-16 px-4 overflow-hidden bg-white dark:bg-[var(--app-bg)]">
      <GridDotsBackground opacity={0.5} />
      <GradientBlobs />
      {/* Decorative vector arc */}
      <svg className="absolute bottom-[15%] left-0 w-full h-48 pointer-events-none opacity-20 dark:opacity-10" viewBox="0 0 1200 120" fill="none" preserveAspectRatio="none">
        <motion.path
          d="M0 80 Q300 20 600 60 T1200 40"
          stroke="#FF6B35"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.path
          d="M0 95 Q400 50 800 70 T1200 55"
          stroke="#3b82f6"
          strokeWidth="1"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.8 }}
        />
      </svg>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 max-w-5xl w-full text-center">
        {/* Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          Global Manufacturing Procurement Platform
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={itemVariants} className="text-3xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-slate-100 leading-[1.05] tracking-tight mb-6">
          The smarter way to{' '}
          <span className="relative inline-block">
            <span style={{ background: 'linear-gradient(135deg, #FF6B35, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              source parts
            </span>
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute -bottom-2 left-0 w-full"
              height="8" viewBox="0 0 300 8" fill="none"
            >
              <motion.path d="M0 6 Q75 1 150 5 Q225 9 300 4" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </motion.svg>
          </span>{' '}
          globally
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants} className="text-base sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          One platform connecting clients, admins, and suppliers across the entire manufacturing lifecycle —
          from order intake to final delivery, with built-in IP protection.
        </motion.p>

        {/* CTA row */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link to="/demo?role=client"   className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-orange-500   active:scale-[0.97] text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/25  hover:shadow-xl hover:-translate-y-0.5"><Building2 className="w-4 h-4" /> Try as Client</Link>
            <Link to="/demo?role=admin"    className="flex items-center justify-center gap-2 bg-blue-600   hover:bg-blue-500     active:scale-[0.97] text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25    hover:shadow-xl hover:-translate-y-0.5"><Shield    className="w-4 h-4" /> Try as Admin</Link>
            <Link to="/demo?role=supplier" className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500   active:scale-[0.97] text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/25  hover:shadow-xl hover:-translate-y-0.5"><Factory   className="w-4 h-4" /> Try as Supplier</Link>
          </div>
          <Link to="/how-it-works" className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm font-semibold px-6 py-3.5 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <Play className="w-4 h-4" /> Watch How It Works
          </Link>
        </motion.div>

        {/* Hero UI card — glass + blur */}
        <motion.div variants={itemVariants} className="relative max-w-2xl mx-auto mb-6">
          <div className="bg-white/80 dark:bg-[var(--surface)]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-[var(--edge)] shadow-2xl shadow-slate-200/60 dark:shadow-black/30 p-6 ring-1 ring-slate-200/20 dark:ring-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">RZ-JOB-10033 · Valve Body Casting</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">Bronze LG2 · 60 pieces</p>
              </div>
              <span className="text-xs bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 px-2.5 py-1 rounded-full font-semibold">Casting Stage</span>
            </div>
            <MiniPipeline activeIdx={4} />
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[var(--edge)] flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>Sheffield Forge · Awarded</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">£9,100</span>
            </div>
          </div>
          {/* Floating badges */}
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute -top-3 -right-4 bg-white/90 dark:bg-[var(--surface-raised)] backdrop-blur-md border border-slate-200 dark:border-[var(--edge)] rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Tracking
          </motion.div>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-3 -left-4 bg-white/90 dark:bg-[var(--surface-raised)] backdrop-blur-md border border-slate-200 dark:border-[var(--edge)] rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hidden sm:flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> IP Protected
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { label: 'Orders Processed',       value: 340, suffix: '+', color: '#FF6B35' },
    { label: 'On-Time Delivery',        value: 98,  suffix: '%', color: '#10b981' },
    { label: 'Active Suppliers',        value: 47,  suffix: '',  color: '#8b5cf6' },
    { label: 'Portals in One Platform', value: 3,   suffix: '',  color: '#3b82f6' },
  ];
  return (
    <section className="relative bg-slate-900 dark:bg-slate-950 py-14 overflow-hidden">
      <GridDotsBackground className="opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/80 dark:to-slate-950/80 pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="text-center p-4 rounded-2xl bg-white/5 dark:bg-white/[0.06] backdrop-blur-sm border border-white/10 dark:border-white/5"
          >
            <p className="text-4xl font-black mb-2" style={{ color: s.color }}><Counter target={s.value} suffix={s.suffix} /></p>
            <p className="text-sm text-slate-400 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section id="features" className="relative py-14 sm:py-24 px-4 bg-white dark:bg-[var(--app-bg)] overflow-hidden">
      <GridDotsBackground />
      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16 sm:mb-20">
          <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">Platform Features</p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 mb-4">Everything you need, in one place</h2>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Built specifically for manufacturing procurement — not a generic tool adapted for manufacturing.</p>
        </motion.div>

        <div className="space-y-24 sm:space-y-32">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center`}
            >
              <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.03, rotate: 1 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg ring-2 ring-white/20 dark:ring-white/10"
                  style={{ background: `linear-gradient(135deg, ${f.color}20, ${f.color}30)` }}
                >
                  <f.icon className="w-8 h-8" style={{ color: f.color }} />
                </motion.div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mb-4">{f.title}</h3>
                <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">{f.body}</p>
              </div>
              <div className={i % 2 === 1 ? 'md:order-1' : ''}>
                <motion.div
                  initial={{ opacity: 0, x: i % 2 === 0 ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-50/80 dark:bg-[var(--surface)]/80 backdrop-blur-xl border border-slate-100 dark:border-[var(--edge)] rounded-2xl p-6 sm:p-8 min-h-[200px] flex items-center justify-center shadow-lg shadow-slate-200/30 dark:shadow-black/20"
                >
                  <FeatureVisual type={f.visual} color={f.color} />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Role tabs ────────────────────────────────────────────────────────────────
function RoleTabsSection() {
  const [active, setActive] = useState('client');
  const role = ROLES[active];

  return (
    <section id="portals" className="relative py-14 sm:py-24 px-4 bg-slate-50 dark:bg-[var(--surface-raised)]/30 overflow-hidden">
      <GridDotsBackground />
      <div className="relative max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
          <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">Three Portals, One System</p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 mb-4">A dedicated portal for every role</h2>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Each portal is purpose-built — not just the same dashboard with hidden buttons.</p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white dark:bg-[var(--surface)]/90 backdrop-blur-sm border border-slate-200 dark:border-[var(--edge)] rounded-xl p-1 gap-1 shadow-sm">
            {Object.entries(ROLES).map(([key, r]) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${active === key ? 'text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                style={active === key ? { background: r.color } : {}}
              >
                <r.icon className="w-4 h-4" />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="grid md:grid-cols-2 gap-4 md:gap-8 items-start">
            {/* Steps */}
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-base mb-6 leading-relaxed">{role.description}</p>
              <div className="space-y-5">
                {role.steps.map((step, i) => (
                  <motion.div key={i} className="flex gap-4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: role.color }}>{i + 1}</div>
                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">{step.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{step.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8">
                <Link to={role.path} className="inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 active:scale-[0.97] shadow-md hover:shadow-lg"
                  style={{ background: role.color, boxShadow: `0 4px 14px ${role.color}40` }}>
                  Try {role.label} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Mock portal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 dark:border-slate-800 shadow-xl backdrop-blur-sm"
            >
              <div className="flex">
                <div className="w-16 bg-slate-950 flex flex-col items-center py-4 gap-4 border-r border-slate-800">
                  {[BarChart3, Package, FileCheck, Users].map((Icon, j) => (
                    <div key={j} className={`w-8 h-8 rounded-lg flex items-center justify-center ${j === 0 ? 'text-white' : 'text-slate-600'}`} style={j === 0 ? { background: role.color } : {}}>
                      <Icon className="w-4 h-4" />
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4 min-h-[220px]">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: role.color }}>{role.label}</p>
                  <div className="space-y-2 mb-4">
                    {[80, 60, 70, 50].map((w, j) => <div key={j} className="h-2 bg-slate-700 rounded-full" style={{ width: `${w}%` }} />)}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['12', '4', '8'].map((n, j) => (
                      <div key={j} className="bg-slate-800 rounded-lg p-2 text-center">
                        <p className="text-base font-black text-white">{n}</p>
                        <div className="h-1.5 bg-slate-700 rounded-full mt-1 w-10 mx-auto" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center gap-2 bg-slate-800/60 rounded-lg p-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: role.color }} />
                        <div className="h-1.5 bg-slate-700 rounded-full flex-1" />
                        <div className="h-4 w-12 bg-slate-700 rounded-full" />
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

// ─── Pipeline section ─────────────────────────────────────────────────────────
function PipelineSection() {
  const [activeIdx, setActiveIdx] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => setActiveIdx((i) => (i + 1) % PIPELINE_STAGES.length), 1800);
    return () => clearInterval(interval);
  }, []);

  const pipelineHighlights = [
    { label: 'Auto-scrubbed drawings',  icon: Shield,    color: '#3b82f6' },
    { label: 'Competitive bidding',      icon: BarChart3, color: '#8b5cf6' },
    { label: 'Real-time updates',       icon: Zap,       color: '#FF6B35' },
    { label: 'Quality certificates',    icon: FileCheck, color: '#10b981' },
  ];

  return (
    <section className="relative py-14 sm:py-24 px-4 bg-white dark:bg-[var(--app-bg)] overflow-hidden">
      <GridDotsBackground />
      <div className="relative max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-14">
          <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">Order Lifecycle</p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 mb-4">From drawing to delivery, fully tracked</h2>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Every order moves through a defined 11-stage pipeline. Nothing gets lost, nothing gets overlooked.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/80 dark:bg-[var(--surface)]/80 backdrop-blur-xl border border-slate-200 dark:border-[var(--edge)] rounded-2xl p-4 sm:p-8 shadow-lg ring-1 ring-slate-200/20 dark:ring-white/5"
        >
          <div className="flex justify-center mb-8">
            <MiniPipeline activeIdx={activeIdx} />
          </div>
          <div className="text-center">
            <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-2"
              style={{ background: `${PIPELINE_STAGES[activeIdx]?.color}15`, color: PIPELINE_STAGES[activeIdx]?.color }}>
              Currently: {PIPELINE_STAGES[activeIdx]?.label}
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400">Click any stage above or watch the auto-animation</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {pipelineHighlights.map((item, j) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: j * 0.08 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="flex items-center gap-3 bg-slate-50/80 dark:bg-[var(--surface-raised)]/80 backdrop-blur-sm border border-slate-100 dark:border-[var(--edge)] rounded-xl p-4"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: item.color }} />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const { isDark } = useTheme();
  const sectionBg  = isDark ? 'var(--app-bg)' : '#f8fafc';
  const fadeLeft   = `linear-gradient(to right, ${sectionBg}, transparent)`;
  const fadeRight  = `linear-gradient(to left, ${sectionBg}, transparent)`;

  return (
    <section className="relative py-20 bg-slate-50 dark:bg-[var(--surface-raised)]/30 overflow-hidden">
      <GridDotsBackground />
      <div className="relative text-center mb-10 px-4">
        <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">What People Say</p>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Trusted by manufacturers worldwide</h2>
      </div>
      <div className="relative overflow-hidden">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex gap-5 w-max"
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div
              key={i}
              className="w-[80vw] sm:w-72 flex-shrink-0 bg-white/90 dark:bg-[var(--surface)]/90 backdrop-blur-md border border-slate-100 dark:border-[var(--edge)] rounded-2xl p-6 shadow-lg"
            >
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((s) => <Star key={s} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">"{t.quote}"</p>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.title} · {t.company}</p>
              </div>
            </div>
          ))}
        </motion.div>
        <div className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none" style={{ background: fadeLeft }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none" style={{ background: fadeRight }} />
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative py-14 sm:py-24 px-4 bg-slate-900 dark:bg-slate-950 overflow-hidden">
      <GradientBlobs />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,107,53,0.15),transparent)] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-4">Get Started Today</p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
            Ready to modernise your{' '}
            <span style={{ background: 'linear-gradient(135deg, #FF6B35, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              manufacturing procurement?
            </span>
          </h2>
          <p className="text-lg text-slate-400 mb-10">Try the live demo instantly — no account required. Explore all three portals with real sample data.</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <Link to="/demo?role=client"   className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-orange-500   active:scale-[0.97] text-white text-sm font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30  hover:shadow-xl hover:-translate-y-0.5"><Building2 className="w-4 h-4" /> Enter as Client</Link>
            <Link to="/demo?role=admin"    className="flex items-center justify-center gap-2 bg-blue-500   hover:bg-blue-400     active:scale-[0.97] text-white text-sm font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20    hover:shadow-xl hover:-translate-y-0.5"><Shield    className="w-4 h-4" /> Enter as Admin</Link>
            <Link to="/demo?role=supplier" className="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-400   active:scale-[0.97] text-white text-sm font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20  hover:shadow-xl hover:-translate-y-0.5"><Factory   className="w-4 h-4" /> Enter as Supplier</Link>
          </div>
          <p className="text-xs text-slate-500 mt-6">5 sample clients · 5 sample suppliers · Orders across all 11 stages</p>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-4">
            <Link to="/pricing" className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-2">View pricing</Link>
            {' '}· Starter, Growth & Enterprise plans
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="bg-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 md:hidden">
          <img src="/light-logo.png" alt="RZ" className="h-8 object-contain mb-3 invert opacity-80" />
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">B2B manufacturing procurement platform for global industry. Three portals, one system.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10">
          <div className="hidden md:block">
            <img src="/light-logo.png" alt="RZ" className="h-8 object-contain mb-3 invert opacity-80" />
            <p className="text-xs text-slate-500 leading-relaxed">B2B manufacturing procurement platform for global industry. Three portals, one system.</p>
          </div>
          {[
            { title: 'Product',  links: ['Features', 'How It Works', 'Pricing', 'Roadmap'] },
            { title: 'Portals',  links: ['Client Portal', 'Control Centre', 'Supplier Hub'] },
            { title: 'Company',  links: ['About RZ', 'Contact', 'Privacy Policy', 'Terms'] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 sm:mb-4">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    {link === 'How It Works'
                      ? <Link to="/how-it-works" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{link}</Link>
                      : link === 'Pricing'
                      ? <Link to="/pricing" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{link}</Link>
                      : link === 'Features'
                      ? <button type="button" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs text-slate-500 hover:text-slate-300 transition-colors text-left w-full">{link}</button>
                      : link === 'Roadmap'
                      ? <Link to="/roadmap" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{link}</Link>
                      : <span className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">{link}</span>
                    }
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-slate-600">© 2026 RZ Global Solutions Ltd. All rights reserved.</p>
          <p className="text-xs text-slate-600 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Global Platform</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="font-sans antialiased bg-white dark:bg-[var(--app-bg)] text-slate-900 dark:text-slate-100 min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <LandingNav />
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
