import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Building2, Shield, Factory, Upload, Eye, CheckCircle2, Play,
} from 'lucide-react';
import EmbeddedPipelineDemo from '@/components/EmbeddedPipelineDemo';
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
  const dotColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
    </div>
  );
}

function GradientBlobs() {
  const { isDark } = useTheme();
  const o = isDark ? 0.4 : 0.25;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div animate={{ scale: [1, 1.12, 1], opacity: [o, o * 0.7, o] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
        style={{ background: `radial-gradient(circle, ${BRAND}15 0%, transparent 70%)` }} />
      <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [o * 0.5, o * 0.7, o * 0.5] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, #8b5cf610 0%, transparent 70%)' }} />
    </div>
  );
}

const STEPS = [
  {
    id: 'client',
    title: 'Client submits order',
    subtitle: 'Upload drawings, specs, and delivery requirements',
    icon: Building2,
    color: BRAND,
    details: [
      'Upload technical drawings (PDF, DWG)',
      'Specify material, quantity, and delivery date',
      'Order enters the RZ pipeline',
    ],
  },
  {
    id: 'admin',
    title: 'Admin sanitises & manages',
    subtitle: 'AI strips client identifiers, opens bidding',
    icon: Shield,
    color: '#3b82f6',
    details: [
      'AI drawing sanitisation removes client identifiers',
      'Sanitised drawings released to supplier pool',
      'Review bids, award jobs, monitor production',
    ],
  },
  {
    id: 'supplier',
    title: 'Supplier bids & delivers',
    subtitle: 'Compete fairly, win work, track milestones',
    icon: Factory,
    color: '#8b5cf6',
    details: [
      'Browse open jobs with sanitised drawings',
      'Submit competitive bids with pricing & lead time',
      'Update milestones, upload QC docs, deliver',
    ],
  },
];

export default function HowItWorksPage() {
  const { isDark } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay]     = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => setActiveStep((i) => (i + 1) % STEPS.length), 4000);
    return () => clearInterval(t);
  }, [autoPlay]);

  const handleStepClick = (i) => {
    setActiveStep(i);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 8000);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      <PublicNav activePage="how-it-works" />

      <main className="pt-24 pb-20 px-4">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <GradientBlobs />
          <GridDotsBackground />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="relative text-center max-w-3xl mx-auto mb-16 pt-8">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: BRAND }}>How It Works</p>
            <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight" style={{ color: 'var(--heading)' }}>
              From order to delivery in{' '}
              <span style={{ background: `linear-gradient(135deg, ${BRAND}, #f97316)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                three simple steps
              </span>
            </h1>
            <p className="text-lg" style={{ color: 'var(--body)' }}>
              See how clients, admins, and suppliers work together on one platform — with IP protection at every stage.
            </p>
          </motion.div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-12">
          {STEPS.map((step, i) => (
            <motion.button key={step.id} onClick={() => handleStepClick(i)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={activeStep === i
                ? { background: step.color, color: '#fff', boxShadow: `0 4px 16px ${step.color}40` }
                : { color: 'var(--body)', ...glassCard(isDark) }
              }>
              <step.icon className="w-4 h-4" />
              {step.title.split(' ')[0]}
            </motion.button>
          ))}
        </div>

        {/* Step content */}
        <div className="max-w-4xl mx-auto mb-20">
          <AnimatePresence mode="wait">
            {STEPS.map((step, i) =>
              activeStep === i ? (
                <motion.div key={step.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid md:grid-cols-2 gap-8 items-center"
                >
                  {/* Text side */}
                  <div>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${step.color}20, ${step.color}35)`, border: `1px solid ${step.color}25` }}>
                      <step.icon className="w-7 h-7" style={{ color: step.color }} />
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--heading)' }}>{step.title}</h2>
                    <p className="mb-6" style={{ color: 'var(--body)' }}>{step.subtitle}</p>
                    <ul className="space-y-3">
                      {step.details.map((d, j) => (
                        <motion.li key={j} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: j * 0.08 + 0.15 }}
                          className="flex items-start gap-2.5" style={{ color: 'var(--body)' }}>
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: step.color }} />
                          {d}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Mock UI side */}
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className="rounded-2xl p-6 backdrop-blur-xl"
                    style={{ ...glassCard(isDark), borderTop: `3px solid ${step.color}` }}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${step.color}18` }}>
                          <step.icon className="w-4 h-4" style={{ color: step.color }} />
                        </div>
                        <span className="text-sm font-bold" style={{ color: 'var(--heading)' }}>{step.title}</span>
                      </div>
                      {step.id === 'client' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
                          <div className="rounded-xl p-6 text-center border-2 border-dashed" style={{ borderColor: `${step.color}40` }}>
                            <Upload className="w-10 h-10 mx-auto mb-2" style={{ color: step.color, opacity: 0.5 }} />
                            <p className="text-xs" style={{ color: 'var(--body)' }}>Click to upload drawings</p>
                          </div>
                          <div className="flex gap-2">
                            {['Material', 'Qty', 'Delivery'].map((l, j) => (
                              <div key={j} className="flex-1 h-7 rounded-lg" style={{ background: 'var(--surface-inset)' }} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                      {step.id === 'admin' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
                          {[60, 40].map((w, j) => (
                            <div key={j} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--surface-inset)' }}>
                              <Eye className="w-4 h-4 text-blue-500" />
                              <div className="h-2 rounded flex-1" style={{ width: `${w}%`, background: 'var(--edge-strong)' }} />
                            </div>
                          ))}
                          <div className="flex gap-2 mt-3">
                            <div className="flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-semibold text-white"
                              style={{ background: step.color }}>Approve</div>
                            <div className="flex-1 h-9 rounded-lg" style={{ background: 'var(--surface-inset)' }} />
                          </div>
                        </motion.div>
                      )}
                      {step.id === 'supplier' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
                          <div className="rounded-xl p-3" style={{ background: 'var(--surface-inset)', border: '1px solid var(--edge)' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--heading)' }}>Valve Body Casting</p>
                            <p className="text-[10px]" style={{ color: 'var(--body)' }}>Bronze LG2 · 60 pcs · Sanitised</p>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 h-9 rounded-lg px-3 flex items-center text-xs" style={{ background: 'var(--surface-inset)', border: '1px solid var(--edge)', color: 'var(--caption)' }}>
                              £ / bid
                            </div>
                            <div className="w-20 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: step.color }}>Bid</div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>

        {/* Live embedded demo */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: BRAND }}>Live Demo</p>
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--heading)' }}>See the real pipeline in action</h2>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--body)' }}>
              This is the actual Control Centre pipeline board — with real demo data. Try the full demo to interact with it.
            </p>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <EmbeddedPipelineDemo />
          </motion.div>
          <div className="mt-8 text-center">
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Link to="/request-demo"
                className="inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg transition-all"
                style={{ background: BRAND, boxShadow: `0 6px 20px rgba(255,107,53,0.35)` }}>
                <Play className="w-4 h-4" /> Request demo access
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative mt-24 rounded-2xl p-8 sm:p-12 text-center max-w-4xl mx-auto overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
          {/* Subtle radial glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,107,53,0.12) 0%, transparent 70%)` }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${BRAND}, transparent)` }} />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: 'var(--heading)' }}>Ready to try it yourself?</h2>
            <p className="mb-10 max-w-lg mx-auto" style={{ color: 'var(--body)' }}>
              Request demo access and we'll email you a link. Once approved, explore all three portals with sample data.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {[
                { label: 'Client Demo',   color: BRAND,     icon: Building2 },
                { label: 'Admin Demo',    color: '#3b82f6', icon: Shield },
                { label: 'Supplier Demo', color: '#8b5cf6', icon: Factory },
              ].map((btn) => (
                <motion.div key={btn.label} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/request-demo"
                    className="flex items-center justify-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl"
                    style={{ background: btn.color, boxShadow: `0 4px 16px ${btn.color}35` }}>
                    <btn.icon className="w-4 h-4" /> {btn.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
