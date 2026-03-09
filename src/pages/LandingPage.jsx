import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowRight, Shield, Zap, Users, BarChart3, FileCheck, Clock, CheckCircle2,
  Package, Layers, GitBranch, Globe, Menu, X, ChevronRight, Star, TrendingUp,
  Lock, Eye, Building2, Factory, Wrench, Truck, Award,
} from 'lucide-react';

// Force light mode
function useForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.classList.contains('dark');
    root.classList.remove('dark');
    root.classList.add('light');
    return () => {
      root.classList.remove('light');
      if (prev) root.classList.add('dark');
    };
  }, []);
}

// Animated counter
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

// Order pipeline mini visual
const PIPELINE_STAGES = [
  { label: 'Submit', color: '#6366f1', icon: Package },
  { label: 'Review', color: '#f59e0b', icon: Eye },
  { label: 'Bidding', color: '#8b5cf6', icon: BarChart3 },
  { label: 'Awarded', color: '#FF6B35', icon: Award },
  { label: 'Production', color: '#10b981', icon: Wrench },
  { label: 'QC', color: '#06b6d4', icon: CheckCircle2 },
  { label: 'Delivered', color: '#22c55e', icon: Truck },
];

function MiniPipeline({ activeIdx = 4 }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1 scrollbar-none">
      {PIPELINE_STAGES.map((stage, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={stage.label}>
            <div className="flex flex-col items-center flex-shrink-0">
              <motion.div
                animate={active ? { scale: [1, 1.08, 1], boxShadow: [`0 0 0px ${stage.color}00`, `0 0 16px ${stage.color}66`, `0 0 0px ${stage.color}00`] } : {}}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all"
                style={{
                  background: done || active ? stage.color : '#f1f5f9',
                  borderColor: done || active ? stage.color : '#e2e8f0',
                }}
              >
                <stage.icon className="w-4 h-4" style={{ color: done || active ? '#fff' : '#94a3b8' }} />
              </motion.div>
              <span className="text-[9px] mt-1.5 font-semibold text-center" style={{ color: active ? stage.color : done ? '#64748b' : '#cbd5e1' }}>
                {stage.label}
              </span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className="w-8 h-0.5 flex-shrink-0 mb-4 rounded-full" style={{ background: i < activeIdx ? stage.color : '#e2e8f0' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Role data
const ROLES = {
  client: {
    label: 'Client Portal',
    color: '#FF6B35',
    icon: Building2,
    description: 'For manufacturers needing precision parts sourced and tracked end-to-end.',
    steps: [
      { title: 'Submit Your Order', body: 'Upload technical drawings, specify material, quantity, and delivery requirements.' },
      { title: 'Real-Time Tracking', body: 'Follow your job through every production stage with live status updates.' },
      { title: 'Receive & Sign Off', body: 'Get notified on dispatch. Review quality certificates and sign off on delivery.' },
    ],
    path: '/demo?role=client',
  },
  admin: {
    label: 'Control Centre',
    color: '#3b82f6',
    icon: Shield,
    description: 'Full command over the procurement pipeline — from intake through final delivery.',
    steps: [
      { title: 'Sanitise Drawings', body: 'AI-powered engine strips client identifiers from technical drawings before supplier release.' },
      { title: 'Manage Bidding', body: 'Review supplier bids, compare pricing and lead times, and award jobs with one click.' },
      { title: 'Monitor Production', body: 'Real-time pipeline board gives a live view of all active jobs across every stage.' },
    ],
    path: '/demo?role=admin',
  },
  supplier: {
    label: 'Supplier Hub',
    color: '#8b5cf6',
    icon: Factory,
    description: 'Manufacturers worldwide compete fairly for jobs with sanitised drawings and transparent bidding.',
    steps: [
      { title: 'Discover New Jobs', body: 'Browse open jobs matching your specialisms — sanitised drawings protect client IP.' },
      { title: 'Submit Bids', body: 'Provide competitive pricing and lead times. Bids are reviewed by the RZ admin team.' },
      { title: 'Track Production', body: 'Update job milestones, upload quality documents, and manage your production pipeline.' },
    ],
    path: '/demo?role=supplier',
  },
};

// Features bento grid
const FEATURES = [
  {
    title: 'AI Drawing Sanitisation',
    body: 'Claude Vision automatically removes client identifiers before drawings reach suppliers. Prevents direct poaching.',
    icon: Shield,
    color: '#3b82f6',
    span: 'col-span-1',
    size: 'large',
  },
  {
    title: 'Live Pipeline Board',
    body: '11-stage Kanban across all active orders. Admin has full visibility at all times.',
    icon: GitBranch,
    color: '#FF6B35',
    span: 'col-span-1',
    size: 'medium',
  },
  {
    title: 'Competitive Bidding',
    body: 'Suppliers bid on sanitised jobs. Clients get best price. Fair and transparent.',
    icon: BarChart3,
    color: '#8b5cf6',
    span: 'col-span-1',
    size: 'medium',
  },
  {
    title: 'Real-Time Tracking',
    body: 'WebSocket-powered live updates. Every stage change reflected instantly across all portals.',
    icon: Zap,
    color: '#10b981',
    span: 'col-span-1',
    size: 'medium',
  },
  {
    title: 'Document Vault',
    body: 'Certificates of conformity, quality reports, shipping documents — all stored per job.',
    icon: FileCheck,
    color: '#f59e0b',
    span: 'col-span-1',
    size: 'medium',
  },
  {
    title: '3-Role Access System',
    body: 'Client, Admin, and Supplier portals each with role-specific permissions and views.',
    icon: Users,
    color: '#06b6d4',
    span: 'col-span-1',
    size: 'medium',
  },
];

// Testimonials
const TESTIMONIALS = [
  { quote: 'We cut sourcing time by 60% in the first month. The pipeline visibility alone is worth it.', name: 'James T.', title: 'Procurement Director', company: 'Aerospace OEM' },
  { quote: 'The AI sanitisation gives us confidence our IP is protected every time we tender a job.', name: 'Priya P.', title: 'Engineering Manager', company: 'Precision Manufacturer' },
  { quote: 'We went from 3 email chains per order to one platform. Night and day difference.', name: 'Oliver W.', title: 'Operations Lead', company: 'Industrial Supply Co.' },
  { quote: 'As a supplier, the sanitised drawings are always clean and professional. Bid process is fast.', name: 'Sheffield Forge', title: 'Managing Director', company: 'Precision Foundry' },
  { quote: 'The dispatch tracking and document vault eliminated all our post-delivery disputes.', name: 'Marcus B.', title: 'Supply Chain Manager', company: 'Engineering Works' },
];

// Navbar
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/light-logo.png" alt="RZ" className="h-8 object-contain" />
          <span className="text-sm font-bold text-slate-800 hidden sm:block">RZ Global Solutions</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How it Works', 'Portals'].map((item) => (
            <button key={item} className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">{item}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
            Sign In
          </Link>
          <Link
            to="/demo"
            className="flex items-center gap-2 bg-[#FF6B35] hover:bg-orange-500 active:scale-[0.97] text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/40"
          >
            Try Demo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-500 hover:text-slate-900 p-1">
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
            className="md:hidden bg-white border-t border-slate-100 px-4 pb-4 pt-2 space-y-2 overflow-hidden"
          >
            <Link to="/login" className="block py-2 text-sm text-slate-600 font-medium">Sign In</Link>
            <Link to="/demo" className="block py-2 text-sm text-[#FF6B35] font-bold">Try Demo →</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// Hero
function HeroSection() {
  const navigate = useNavigate();
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-16 px-4 overflow-hidden bg-[#fafafa]">
      {/* Gradient mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-5%] w-[700px] h-[700px] rounded-full opacity-40" style={{ background: 'radial-gradient(circle, #FF6B3520 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #3b82f615 0%, transparent 70%)' }} />
        <div className="absolute top-[30%] left-[10%] w-[300px] h-[300px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #8b5cf610 0%, transparent 70%)' }} />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl w-full text-center"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          Global Manufacturing Procurement Platform
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={itemVariants} className="text-3xl sm:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
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
        <motion.p variants={itemVariants} className="text-base sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          One platform connecting clients, admins, and suppliers across the entire manufacturing lifecycle —
          from order intake to final delivery, with built-in IP protection.
        </motion.p>

        {/* CTA row */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link to="/demo?role=client" className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-orange-500 active:scale-[0.97] text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5">
              <Building2 className="w-4 h-4" /> Try as Client
            </Link>
            <Link to="/demo?role=admin" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.97] text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5">
              <Shield className="w-4 h-4" /> Try as Admin
            </Link>
            <Link to="/demo?role=supplier" className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[0.97] text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/35 hover:-translate-y-0.5">
              <Factory className="w-4 h-4" /> Try as Supplier
            </Link>
          </div>
        </motion.div>

        {/* Hero UI card */}
        <motion.div
          variants={itemVariants}
          className="relative max-w-2xl mx-auto mb-6"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">RZ-JOB-10033 · Valve Body Casting</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">Bronze LG2 · 60 pieces</p>
              </div>
              <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full font-semibold">
                Casting Stage
              </span>
            </div>
            <MiniPipeline activeIdx={4} />
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Sheffield Forge · Awarded</span>
              <span className="text-emerald-600 font-semibold">£9,100</span>
            </div>
          </div>
          {/* Floating badges */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute -top-3 -right-4 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-slate-700 flex items-center gap-2 hidden sm:flex"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live Tracking
          </motion.div>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-3 -left-4 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-blue-600 flex items-center gap-2 hidden sm:flex"
          >
            <Shield className="w-3.5 h-3.5" />
            IP Protected
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// Stats bar
function StatsBar() {
  const stats = [
    { label: 'Orders Processed', value: 340, suffix: '+', color: '#FF6B35' },
    { label: 'On-Time Delivery', value: 98, suffix: '%', color: '#10b981' },
    { label: 'Active Suppliers', value: 47, suffix: '', color: '#8b5cf6' },
    { label: 'Portals in One Platform', value: 3, suffix: '', color: '#3b82f6' },
  ];

  return (
    <section className="bg-slate-900 py-14">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <p className="text-4xl font-black mb-2" style={{ color: s.color }}>
              <Counter target={s.value} suffix={s.suffix} />
            </p>
            <p className="text-sm text-slate-400 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Features grid
function FeaturesSection() {
  return (
    <section className="py-14 sm:py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">Platform Features</p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-4">Everything you need, in one place</h2>
          <p className="text-base text-slate-500 max-w-xl mx-auto">Built specifically for manufacturing procurement — not a generic tool adapted for manufacturing.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}15` }}>
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Role tabs
function RoleTabsSection() {
  const [active, setActive] = useState('client');
  const role = ROLES[active];

  return (
    <section className="py-14 sm:py-24 px-4 bg-[#f8f8fb]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">Three Portals, One System</p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-4">A dedicated portal for every role</h2>
          <p className="text-base text-slate-500 max-w-xl mx-auto">Each portal is purpose-built — not just the same dashboard with hidden buttons.</p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
            {Object.entries(ROLES).map(([key, r]) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  active === key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
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
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="grid md:grid-cols-2 gap-4 md:gap-8 items-start"
          >
            {/* Steps */}
            <div>
              <p className="text-slate-500 text-base mb-6 leading-relaxed">{role.description}</p>
              <div className="space-y-5">
                {role.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: role.color }}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">{step.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  to={role.path}
                  className="inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 active:scale-[0.97] shadow-md hover:shadow-lg"
                  style={{ background: role.color, boxShadow: `0 4px 14px ${role.color}40` }}
                >
                  Try {role.label} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Mock portal card */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
              {/* Mock sidebar + content */}
              <div className="flex">
                <div className="w-16 bg-slate-950 flex flex-col items-center py-4 gap-4 border-r border-slate-800">
                  {[BarChart3, Package, FileCheck, Users].map((Icon, j) => (
                    <div key={j} className={`w-8 h-8 rounded-lg flex items-center justify-center ${j === 0 ? 'text-white' : 'text-slate-600'}`}
                      style={j === 0 ? { background: role.color } : {}}>
                      <Icon className="w-4 h-4" />
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4 min-h-[220px]">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: role.color }}>{role.label}</p>
                  {/* Skeleton content */}
                  <div className="space-y-2 mb-4">
                    {[80, 60, 70, 50].map((w, j) => (
                      <div key={j} className="h-2 bg-slate-700 rounded-full" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  {/* Mini stat cards */}
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
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// Pipeline visual
function PipelineSection() {
  const [activeIdx, setActiveIdx] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((i) => (i + 1) % PIPELINE_STAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-14 sm:py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">Order Lifecycle</p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-4">From drawing to delivery, fully tracked</h2>
          <p className="text-base text-slate-500 max-w-xl mx-auto">Every order moves through a defined 11-stage pipeline. Nothing gets lost, nothing gets overlooked.</p>
        </motion.div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 shadow-sm">
          <div className="flex justify-center mb-8">
            <MiniPipeline activeIdx={activeIdx} />
          </div>

          {/* Stage description */}
          <div className="text-center">
            <span
              className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-2"
              style={{ background: `${PIPELINE_STAGES[activeIdx]?.color}15`, color: PIPELINE_STAGES[activeIdx]?.color }}
            >
              Currently: {PIPELINE_STAGES[activeIdx]?.label}
            </span>
            <p className="text-sm text-slate-500">Click any stage above or watch the auto-animation</p>
          </div>
        </div>

        {/* Stage cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Auto-scrubbed drawings', icon: Shield, color: '#3b82f6' },
            { label: 'Competitive bidding', icon: BarChart3, color: '#8b5cf6' },
            { label: 'Real-time updates', icon: Zap, color: '#FF6B35' },
            { label: 'Quality certificates', icon: FileCheck, color: '#10b981' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
              <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: item.color }} />
              <p className="text-xs font-semibold text-slate-700">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials marquee
function TestimonialsSection() {
  return (
    <section className="py-20 bg-[#f8f8fb] overflow-hidden">
      <div className="text-center mb-10 px-4">
        <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">What People Say</p>
        <h2 className="text-3xl font-black text-slate-900">Trusted by manufacturers worldwide</h2>
      </div>
      <div className="relative overflow-hidden">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex gap-5 w-max"
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div key={i} className="w-72 flex-shrink-0 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((s) => <Star key={s} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">"{t.quote}"</p>
              <div>
                <p className="text-xs font-bold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-400">{t.title} · {t.company}</p>
              </div>
            </div>
          ))}
        </motion.div>
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#f8f8fb] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#f8f8fb] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

// Final CTA
function CTASection() {
  return (
    <section className="py-14 sm:py-24 px-4 bg-slate-900">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-4">Get Started Today</p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
            Ready to modernise your{' '}
            <span style={{ background: 'linear-gradient(135deg, #FF6B35, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              manufacturing procurement?
            </span>
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Try the live demo instantly — no account required. Explore all three portals with real sample data.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <Link to="/demo?role=client" className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-orange-500 active:scale-[0.97] text-white text-sm font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5">
              <Building2 className="w-4 h-4" /> Enter as Client
            </Link>
            <Link to="/demo?role=admin" className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 active:scale-[0.97] text-white text-sm font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
              <Shield className="w-4 h-4" /> Enter as Admin
            </Link>
            <Link to="/demo?role=supplier" className="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-400 active:scale-[0.97] text-white text-sm font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5">
              <Factory className="w-4 h-4" /> Enter as Supplier
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-6">5 sample clients · 5 sample suppliers · Orders across all 11 stages</p>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function LandingFooter() {
  return (
    <footer className="bg-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Logo + tagline — full width on mobile */}
        <div className="mb-8 md:hidden">
          <img src="/light-logo.png" alt="RZ" className="h-8 object-contain mb-3 invert opacity-80" />
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            B2B manufacturing procurement platform for global industry. Three portals, one system.
          </p>
        </div>

        {/* Link columns grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-6 md:gap-8 mb-10">
          {/* Logo col — desktop only */}
          <div className="hidden md:block">
            <img src="/light-logo.png" alt="RZ" className="h-8 object-contain mb-3 invert opacity-80" />
            <p className="text-xs text-slate-500 leading-relaxed">
              B2B manufacturing procurement platform for global industry. Three portals, one system.
            </p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'How It Works', 'Pricing', 'Roadmap'] },
            { title: 'Portals', links: ['Client Portal', 'Control Centre', 'Supplier Hub'] },
            { title: 'Company', links: ['About RZ', 'Contact', 'Privacy Policy', 'Terms'] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 sm:mb-4">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}><span className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">{link}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-slate-600">© 2026 RZ Global Solutions Ltd. All rights reserved.</p>
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            Global Platform
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main page
export default function LandingPage() {
  useForceLightTheme();

  return (
    <div className="font-sans antialiased" style={{ fontFamily: "'DM Sans', sans-serif" }}>
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
