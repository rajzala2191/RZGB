import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Shield, Factory, ArrowRight, FlaskConical, CheckCircle2, Loader2 } from 'lucide-react';

const PORTALS = [
  {
    key: 'client',
    label: 'Client Portal',
    role: 'You are a UK manufacturer',
    icon: Building2,
    color: '#FF6B35',
    border: 'border-orange-200 hover:border-orange-400',
    badge: 'bg-orange-100 text-orange-700',
    dash: '/demo/client/create-order',
    description: 'Submit manufacturing orders, track progress across all stages, and manage your supplier relationships.',
    perks: ['Create orders with drawings & specs', 'Real-time order tracking', 'Document vault & sign-off', 'Supplier bid visibility'],
    account: 'James Thornton · Thornton Precision Ltd',
  },
  {
    key: 'admin',
    label: 'Control Centre',
    role: 'You are an RZ admin',
    icon: Shield,
    color: '#3b82f6',
    border: 'border-blue-200 hover:border-blue-400',
    badge: 'bg-blue-100 text-blue-700',
    dash: '/demo/admin/pipeline',
    description: 'Manage the full order lifecycle — sanitise drawings, oversee bidding, and monitor production across all clients.',
    perks: ['AI drawing sanitisation queue', 'Full pipeline board (11 stages)', 'Bid management & award', 'All users & analytics'],
    account: 'Alex Morgan · RZ Global Solutions',
  },
  {
    key: 'supplier',
    label: 'Supplier Hub',
    role: 'You are a UK manufacturer / supplier',
    icon: Factory,
    color: '#8b5cf6',
    border: 'border-violet-200 hover:border-violet-400',
    badge: 'bg-violet-100 text-violet-700',
    dash: '/demo/supplier',
    description: 'Discover and bid on manufacturing jobs, manage your production milestones, and grow your order book.',
    perks: ['Browse sanitised job listings', 'Submit competitive bids', 'Production milestone tracking', 'Document upload & QC'],
    account: 'FoundryTech UK · Rating 4.8★',
  },
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const card = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

export default function DemoEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(null);

  // Auto-enter if ?role=client|admin|supplier is in the URL
  useEffect(() => {
    const role = searchParams.get('role');
    if (!role) return;
    const portal = PORTALS.find((p) => p.key === role);
    if (portal) handleEnter(portal);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEnter(portal) {
    setLoading(portal.key);
    localStorage.setItem('rzgb-demo-session', JSON.stringify({
      sessionId: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      orderCreated: false,
      lastRole: portal.key,
    }));
    navigate(portal.dash);
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-4 py-16 font-sans" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold px-4 py-2 rounded-full mb-5">
          <FlaskConical className="w-3.5 h-3.5" />
          SANDBOX ENVIRONMENT — No real data affected
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">Choose your portal</h1>
        <p className="text-lg text-slate-500 max-w-lg mx-auto">
          One click to enter — no account or password needed. All data is pre-loaded with realistic UK manufacturing scenarios.
        </p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="visible" className="grid md:grid-cols-3 gap-5 w-full max-w-5xl">
        {PORTALS.map((portal) => (
          <motion.div
            key={portal.key}
            variants={card}
            className={`relative bg-white border-2 rounded-2xl p-6 flex flex-col transition-all duration-200 ${portal.border}`}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${portal.color}18` }}>
              <portal.icon className="w-6 h-6" style={{ color: portal.color }} />
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full self-start mb-3 ${portal.badge}`}>{portal.role}</span>
            <h2 className="text-xl font-black text-slate-900 mb-2">{portal.label}</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">{portal.description}</p>
            <ul className="space-y-2 mb-6 flex-1">
              {portal.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: portal.color }} />
                  {perk}
                </li>
              ))}
            </ul>
            <div className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 mb-4 font-medium">
              Demo account: {portal.account}
            </div>
            <button
              onClick={() => handleEnter(portal)}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:-translate-y-0.5 shadow-sm disabled:opacity-70 disabled:cursor-wait"
              style={{ background: portal.color }}
            >
              {loading === portal.key
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
                : <>Enter {portal.label} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 text-center">
        <p className="text-xs text-slate-400 mb-2">You can switch between portals at any time using the orange demo bar.</p>
        <Link to="/landing" className="text-xs text-slate-400 hover:text-slate-600 underline">← Back to product overview</Link>
      </motion.div>
    </div>
  );
}
