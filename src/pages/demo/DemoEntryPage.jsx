import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Shield, Factory, ArrowRight, FlaskConical, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import ThemeToggle from '@/components/ThemeToggle';

const PORTALS = [
  {
    key: 'client',
    label: 'Client Portal',
    role: 'You are a UK manufacturer',
    icon: Building2,
    color: '#FF6B35',
    border: 'border-orange-200 hover:border-orange-400',
    badge: 'bg-orange-100 text-orange-700',
    email: 'demo.client@vrocure.co.uk',
    dash: '/client-dashboard',
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
    email: 'demo.admin@vrocure.co.uk',
    dash: '/control-centre',
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
    email: 'demo.supplier@vrocure.co.uk',
    dash: '/supplier-hub',
    description: 'Discover and bid on manufacturing jobs, manage your production milestones, and grow your order book.',
    perks: ['Browse sanitised job listings', 'Submit competitive bids', 'Production milestone tracking', 'Document upload & QC'],
    account: 'FoundryTech UK · Rating 4.8★',
  },
];

const DEMO_PASSWORD = 'RZDemo2024!';

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const card = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

export default function DemoEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  // Auto-enter if ?role=client|admin|supplier is in the URL
  useEffect(() => {
    const role = searchParams.get('role');
    if (!role) return;
    const portal = PORTALS.find((p) => p.key === role);
    if (portal) handleEnter(portal);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEnter(portal) {
    setLoading(portal.key);
    setError(null);
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: portal.email,
      password: DEMO_PASSWORD,
    });
    if (authErr) {
      setError('Demo accounts are not set up yet. Run: node scripts/seedDemo.js');
      setLoading(null);
      return;
    }
    localStorage.setItem('rzgb-demo-session', JSON.stringify({
      role: portal.key,
      createdAt: new Date().toISOString(),
    }));
    navigate(portal.dash);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 font-sans" style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--app-bg)' }}>
      {/* Theme toggle — top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold px-4 py-2 rounded-full mb-5">
          <FlaskConical className="w-3.5 h-3.5" />
          SANDBOX ENVIRONMENT — No real data affected
        </div>
        <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: 'var(--heading)' }}>Choose your portal</h1>
        <p className="text-lg max-w-lg mx-auto" style={{ color: 'var(--body)' }}>
          One click to enter — no account or password needed. All data is pre-loaded with realistic UK manufacturing scenarios.
        </p>
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 inline-block">{error}</p>
        )}
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="visible" className="grid md:grid-cols-3 gap-5 w-full max-w-5xl">
        {PORTALS.map((portal) => (
          <motion.div
            key={portal.key}
            variants={card}
            className="relative rounded-2xl p-6 flex flex-col transition-all duration-200 border-2"
            style={{ background: 'var(--surface)', borderColor: 'var(--edge)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${portal.color}18` }}>
              <portal.icon className="w-6 h-6" style={{ color: portal.color }} />
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full self-start mb-3 ${portal.badge}`}>{portal.role}</span>
            <h2 className="text-xl font-black mb-2" style={{ color: 'var(--heading)' }}>{portal.label}</h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--body)' }}>{portal.description}</p>
            <ul className="space-y-2 mb-6 flex-1">
              {portal.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm" style={{ color: 'var(--body)' }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: portal.color }} />
                  {perk}
                </li>
              ))}
            </ul>
            <div className="text-xs rounded-lg px-3 py-2 mb-4 font-medium" style={{ color: 'var(--caption)', background: 'var(--surface-inset)' }}>
              Demo account: {portal.account}
            </div>
            <button
              onClick={() => handleEnter(portal)}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:-translate-y-0.5 shadow-sm disabled:opacity-70 disabled:cursor-wait"
              style={{ background: portal.color }}
            >
              {loading === portal.key
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : <>Enter {portal.label} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 text-center">
        <p className="text-xs mb-2" style={{ color: 'var(--caption)' }}>You can switch between portals at any time using the demo bar at the top.</p>
        <Link to="/landing" className="text-xs underline hover:opacity-80" style={{ color: 'var(--body)' }}>← Back to product overview</Link>
      </motion.div>
    </div>
  );
}
