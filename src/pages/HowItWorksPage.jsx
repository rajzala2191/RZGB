import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Building2, Shield, Factory, Upload, Eye, CheckCircle2, Play,
} from 'lucide-react';
import EmbeddedPipelineDemo from '@/components/EmbeddedPipelineDemo';
import ThemeToggle from '@/components/ThemeToggle';

const STEPS = [
  {
    id: 'client',
    title: 'Client submits order',
    subtitle: 'Upload drawings, specs, and delivery requirements',
    icon: Building2,
    color: '#FF6B35',
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
      'AI draws sanitisation removes client identifiers',
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
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => {
      setActiveStep((i) => (i + 1) % STEPS.length);
    }, 4000);
    return () => clearInterval(t);
  }, [autoPlay]);

  return (
    <div className="min-h-screen font-sans antialiased" style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--app-bg)' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-3">
            <img src="/light-logo.png" alt="RZ" className="h-8 object-contain dark:invert dark:opacity-90" />
            <span className="text-sm font-bold hidden sm:block" style={{ color: 'var(--heading)' }}>RZ Global Solutions</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/landing" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--body)' }}>
              Back to Home
            </Link>
            <Link to="/pricing" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--body)' }}>
              Pricing
            </Link>
            <Link
              to="/request-demo"
              className="flex items-center gap-2 bg-[#FF6B35] hover:bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-orange-500/25"
            >
              Request Demo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">How It Works</p>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight" style={{ color: 'var(--heading)' }}>
            From order to delivery in{' '}
            <span style={{ background: 'linear-gradient(135deg, #FF6B35, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              three simple steps
            </span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--body)' }}>
            See how clients, admins, and suppliers work together on one platform — with IP protection at every stage.
          </p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-12">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => { setActiveStep(i); setAutoPlay(false); setTimeout(() => setAutoPlay(true), 8000); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeStep === i ? 'text-white shadow-md' : ''}`}
              style={activeStep === i ? { background: step.color } : { color: 'var(--body)' }}
              style={activeStep === i ? { background: step.color } : {}}
            >
              <step.icon className="w-4 h-4" />
              {step.title.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Step content */}
        <div className="max-w-4xl mx-auto mb-20">
          <AnimatePresence mode="wait">
            {STEPS.map((step, i) =>
              activeStep === i ? (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid md:grid-cols-2 gap-8 items-center"
                >
                  <div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${step.color}20, ${step.color}35)` }}
                    >
                      <step.icon className="w-7 h-7" style={{ color: step.color }} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--heading)' }}>{step.title}</h2>
                    <p className="mb-6" style={{ color: 'var(--body)' }}>{step.subtitle}</p>
                    <ul className="space-y-3">
                      {step.details.map((d, j) => (
                        <li key={j} className="flex items-start gap-2" style={{ color: 'var(--body)' }}>
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: step.color }} />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl shadow-lg p-6" style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
                    {/* Animated mock UI for this step */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${step.color}20` }}>
                          <step.icon className="w-4 h-4" style={{ color: step.color }} />
                        </div>
                        <span className="text-sm font-bold" style={{ color: 'var(--heading)' }}>{step.title}</span>
                      </div>
                      {step.id === 'client' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="space-y-3"
                        >
                          <div className="rounded-xl p-6 text-center border-2 border-dashed" style={{ borderColor: 'var(--edge)' }}>
                            <Upload className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--caption)' }} />
                            <p className="text-xs" style={{ color: 'var(--body)' }}>Click to upload drawings</p>
                          </div>
                          <div className="flex gap-2">
                            {['Material', 'Qty', 'Delivery'].map((l, j) => (
                              <div key={j} className="flex-1 h-6 rounded-lg" style={{ background: 'var(--surface-inset)' }} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                      {step.id === 'admin' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--surface-inset)' }}>
                            <Eye className="w-4 h-4 text-blue-500" />
                            <div className="h-2 rounded flex-1" style={{ width: '60%', background: 'var(--edge-strong)' }} />
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--surface-inset)' }}>
                            <Eye className="w-4 h-4 text-blue-500" />
                            <div className="h-2 rounded flex-1" style={{ width: '40%', background: 'var(--edge-strong)' }} />
                          </div>
                          <div className="flex gap-2 mt-3">
                            <div className="flex-1 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Approve</span>
                            </div>
                            <div className="flex-1 h-8 rounded-lg" style={{ background: 'var(--surface-inset)' }} />
                          </div>
                        </motion.div>
                      )}
                      {step.id === 'supplier' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="space-y-3"
                        >
                          <div className="rounded-xl p-3" style={{ border: '1px solid var(--edge)' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--heading)' }}>Valve Body Casting</p>
                            <p className="text-[10px]" style={{ color: 'var(--body)' }}>Bronze LG2 · 60 pcs · Sanitised</p>
                          </div>
                          <div className="flex gap-2">
                            <input type="text" placeholder="£ / bid" className="flex-1 h-8 rounded-lg px-3 text-xs" style={{ background: 'var(--surface-inset)', border: '1px solid var(--edge)' }} readOnly />
                            <div className="w-20 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-bold text-white">Bid</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>

        {/* Live embedded demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-8">
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Live Demo</p>
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--heading)' }}>See the real pipeline in action</h2>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--body)' }}>
              This is the actual Control Centre pipeline board — with real demo data. Try the full demo to interact with it.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <EmbeddedPipelineDemo />
          </motion.div>

          <div className="mt-8 text-center">
            <Link
              to="/demo?role=admin"
              className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-orange-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4" /> Launch Full Demo
            </Link>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 rounded-2xl p-8 sm:p-12 text-center max-w-4xl mx-auto"
          style={{ background: 'var(--surface)' }}
        >
          <h2 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: 'var(--heading)' }}>Ready to try it yourself?</h2>
          <p className="mb-10 max-w-lg mx-auto" style={{ color: 'var(--body)' }}>
            Enter the demo with one click — no account required. Explore all three portals with realistic sample data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/demo?role=client" className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-orange-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all">
              <Building2 className="w-4 h-4" /> Try as Client
            </Link>
            <Link to="/demo?role=admin" className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all">
              <Shield className="w-4 h-4" /> Try as Admin
            </Link>
            <Link to="/demo?role=supplier" className="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all">
              <Factory className="w-4 h-4" /> Try as Supplier
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
