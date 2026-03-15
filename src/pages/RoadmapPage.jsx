import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Zap, Clock, ArrowRight,
  Bug, BarChart3, ScanLine, Brain, MessageSquare,
  FileCheck, Timer, TrendingUp, Bot, Shield,
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import { useTheme } from '@/contexts/ThemeContext';

const BRAND = '#FF6B35';

function glassCard(isDark) {
  return isDark
    ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 40px rgba(0,0,0,0.3)' }
    : { background: 'var(--surface)', border: '1px solid var(--edge)', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' };
}

function GridDotsBackground() {
  const { isDark } = useTheme();
  const dotColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
    </div>
  );
}

function GradientBlobs() {
  const { isDark } = useTheme();
  const o = isDark ? 0.35 : 0.2;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [o, o * 0.6, o] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
        style={{ background: `radial-gradient(circle, ${BRAND}15 0%, transparent 70%)` }} />
      <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [o * 0.4, o * 0.6, o * 0.4] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-[-5%] w-[350px] h-[350px] rounded-full"
        style={{ background: 'radial-gradient(circle, #8b5cf610 0%, transparent 70%)' }} />
    </div>
  );
}

const STATUS = {
  shipped: {
    label: 'Shipped',
    icon: CheckCircle2,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Zap,
    color: BRAND,
    bg: `rgba(255,107,53,0.12)`,
    border: `rgba(255,107,53,0.3)`,
  },
  planned: {
    label: 'Planned',
    icon: Clock,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.3)',
  },
};

const PHASES = [
  {
    phase: 0,
    name: 'Bug Fixes & Code Debt',
    status: 'shipped',
    icon: Bug,
    color: '#10b981',
    description: 'Foundational fixes to ensure correctness and reliability across all core services.',
    bullets: [
      'Fix inconsistent return types in analytics service',
      'Sequential job ID generation (no more random IDs)',
      'Null-safety guards in approval delegation',
      'Shared ORDER_STATUSES constants module',
    ],
  },
  {
    phase: 1,
    name: 'Supplier Intelligence Layer',
    status: 'in-progress',
    icon: BarChart3,
    color: BRAND,
    description: 'Composite 0–100 supplier scorecards surfaced at bid comparison and discovery.',
    bullets: [
      'On-time delivery rate, NCR frequency, bid win rate',
      'Scores persisted to DB and auto-refreshed on events',
      'Score badges on bid comparison and discovery pages',
      'Score-weighted supplier recommendations',
    ],
  },
  {
    phase: 2,
    name: 'AI DFM Analysis',
    status: 'in-progress',
    icon: ScanLine,
    color: '#8b5cf6',
    description: 'AI-powered Design for Manufacturability analysis on every drawing upload.',
    bullets: [
      'Claude Vision analyses technical drawings at upload',
      'Structured DFM report: issues, severity, location',
      'Colour-coded risk badge for admins (Low/Med/High)',
      'Non-blocking client warnings before order submission',
    ],
  },
  {
    phase: 3,
    name: 'Bid Intelligence Copilot',
    status: 'planned',
    icon: Brain,
    color: '#3b82f6',
    description: 'AI analysis of the full bid set — recommended award, outlier flags, market context.',
    bullets: [
      'AI-recommended bid with plain-English rationale',
      'Outlier and risk flag detection',
      'Estimated market rate vs submitted prices',
      'Historical supplier performance woven into analysis',
    ],
  },
  {
    phase: 4,
    name: 'Natural Language Order Creation',
    status: 'planned',
    icon: MessageSquare,
    color: '#06b6d4',
    description: 'Describe your part in plain English — Claude extracts structured order data.',
    bullets: [
      'Free-text input auto-fills the order form via Claude',
      'Low-confidence fields flagged for human review',
      'Multi-turn follow-up for missing or ambiguous fields',
      'Replaces 5-step form for straightforward orders',
    ],
  },
  {
    phase: 5,
    name: 'Automated Invoice Matching',
    status: 'planned',
    icon: FileCheck,
    color: '#f59e0b',
    description: 'Three-way PO–invoice–goods-received matching with auto-approval for clean matches.',
    bullets: [
      'Amount within 2%, supplier match, goods received check',
      'Auto-approve matched invoices; flag discrepancies',
      'Discrepancy details surfaced in approval workflow',
      'Full audit trail for every auto-approval',
    ],
  },
  {
    phase: 6,
    name: 'Predictive Lead Time',
    status: 'planned',
    icon: Timer,
    color: '#ec4899',
    description: 'Predict actual delivery time from supplier × process historical performance.',
    bullets: [
      'Median, p10, p90 lead time by supplier × process',
      'Flag bids where stated lead time looks optimistic',
      'Confidence indicator based on sample count',
      'Surfaces at bid comparison and order creation',
    ],
  },
  {
    phase: 7,
    name: 'Spend Intelligence Upgrades',
    status: 'planned',
    icon: TrendingUp,
    color: '#10b981',
    description: 'AI spend narratives, anomaly detection, and quarter-over-quarter comparison.',
    bullets: [
      'Plain-English spend summaries generated by Claude',
      'Anomaly detection: 2σ from process × material median',
      'Quarter-over-quarter comparison with new supplier highlights',
      'Spend breakdown by supplier, material, and process',
    ],
  },
  {
    phase: 8,
    name: 'Agentic Workflows',
    status: 'planned',
    icon: Bot,
    color: '#8b5cf6',
    description: 'Autonomous agents monitoring the pipeline and acting on SLA breaches.',
    bullets: [
      'Zero-bid RFQ alert: re-notify suppliers 48h before deadline',
      'Approval SLA escalation to approver\'s manager',
      'Milestone updates via inbound email parsed by Claude',
      'Slack notifications for every agent action',
    ],
  },
  {
    phase: 9,
    name: 'Security Hardening',
    status: 'planned',
    icon: Shield,
    color: '#6366f1',
    description: 'Move privileged operations server-side and audit every RLS policy.',
    bullets: [
      'Service-role key removed from browser bundle',
      'Admin operations wrapped in verified Edge Functions',
      'Full RLS policy audit for all tables',
      'Test coverage for every auth context and hook',
    ],
  },
];

const statusCount = {
  shipped: PHASES.filter(p => p.status === 'shipped').length,
  'in-progress': PHASES.filter(p => p.status === 'in-progress').length,
  planned: PHASES.filter(p => p.status === 'planned').length,
};

export default function RoadmapPage() {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      <PublicNav activePage="roadmap" />

      <main className="pt-24 pb-20 px-4">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <GradientBlobs />
          <GridDotsBackground />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="relative text-center max-w-3xl mx-auto mb-16 pt-8">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: BRAND }}>Product Roadmap</p>
            <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight" style={{ color: 'var(--heading)' }}>
              Building{' '}
              <span style={{ background: `linear-gradient(135deg, ${BRAND}, #fb923c 50%, #8b5cf6)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                manufacturing intelligence
              </span>
              {' '}one phase at a time
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--body)' }}>
              Vrocure's roadmap from core procurement to AI-powered agentic workflows. Every phase ships real value.
            </p>
          </motion.div>
        </div>

        {/* Status legend + counts */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-14">
          {Object.entries(STATUS).map(([key, s]) => (
            <div key={key} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
              <span className="ml-1 text-xs opacity-70">({statusCount[key]})</span>
            </div>
          ))}
        </motion.div>

        {/* Phase timeline */}
        <div className="max-w-4xl mx-auto space-y-4">
          {PHASES.map((phase, i) => {
            const s = STATUS[phase.status];
            return (
              <motion.div key={phase.phase}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl p-6 sm:p-7 backdrop-blur-sm"
                style={{ ...glassCard(isDark), borderLeft: `3px solid ${phase.color}` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Phase icon */}
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${phase.color}18`, border: `1px solid ${phase.color}25` }}>
                    <phase.icon className="w-5 h-5" style={{ color: phase.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--caption)' }}>
                        Phase {phase.phase}
                      </span>
                      {/* Status badge */}
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                        <s.icon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-black mb-1" style={{ color: 'var(--heading)' }}>{phase.name}</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--body)' }}>{phase.description}</p>
                    <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      {phase.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs" style={{ color: 'var(--body)' }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: phase.color }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative mt-20 rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,107,53,0.1) 0%, transparent 70%)` }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${BRAND}, transparent)` }} />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: 'var(--heading)' }}>Want early access?</h2>
            <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--body)' }}>
              Request a demo and explore the platform while we build the future of manufacturing procurement.
            </p>
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Link to="/request-demo"
                className="inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg"
                style={{ background: BRAND, boxShadow: `0 6px 20px rgba(255,107,53,0.35)` }}>
                Request demo access <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
