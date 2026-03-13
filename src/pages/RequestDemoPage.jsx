import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, Loader2, Building2, Shield, Factory } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import { useTheme } from '@/contexts/ThemeContext';
import { submitDemoRequest } from '@/services/demoRequestService';

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
        className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full"
        style={{ background: `radial-gradient(circle, ${BRAND}18 0%, transparent 70%)` }} />
      <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [o * 0.4, o * 0.6, o * 0.4] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full"
        style={{ background: 'radial-gradient(circle, #8b5cf610 0%, transparent 70%)' }} />
    </div>
  );
}

export default function RequestDemoPage() {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const value = email.trim().toLowerCase();
    if (!value) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await submitDemoRequest(value);
      setSubmitted(true);
    } catch (err) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      setError(msg.includes('duplicate') || msg.includes('unique') ? 'This email has already requested demo access.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: 'var(--app-bg)' }}>
      <PublicNav />

      <div className="relative overflow-hidden min-h-screen flex items-center justify-center px-4 py-32">
        <GradientBlobs />
        <GridDotsBackground />

        <div className="relative w-full max-w-md">
          {/* Portal perks row */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-3 mb-8">
            {[
              { label: 'Client Portal', color: BRAND, icon: Building2 },
              { label: 'Admin Portal', color: '#3b82f6', icon: Shield },
              { label: 'Supplier Portal', color: '#8b5cf6', icon: Factory },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: `${p.color}15`, border: `1px solid ${p.color}30`, color: p.color }}>
                <p.icon className="w-3 h-3" /> {p.label.split(' ')[0]}
              </div>
            ))}
          </motion.div>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl p-7 sm:p-9 backdrop-blur-xl"
            style={{ ...glassCard(isDark), borderTop: `3px solid ${BRAND}` }}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ background: `${BRAND}18`, border: `1px solid ${BRAND}30` }}>
              <Mail className="w-6 h-6" style={{ color: BRAND }} />
            </div>

            <h1 className="text-xl sm:text-2xl font-black mb-2" style={{ color: 'var(--heading)' }}>
              Request demo access
            </h1>
            <p className="text-sm mb-7" style={{ color: 'var(--body)' }}>
              Enter your email and we'll review your request. Once approved, you'll receive a link to access the full demo — all three portals, real data.
            </p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl p-5 flex items-start gap-3"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>Request received</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--body)' }}>
                    We'll email you at <strong>{email.trim().toLowerCase()}</strong> when your access is approved. Check your inbox (and spam) for the demo link.
                  </p>
                  <p className="text-xs mt-3" style={{ color: 'var(--caption)' }}>
                    Already have access? Use the link from your approval email to open the demo.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="request-demo-email" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--body)' }}>
                    Work email address
                  </label>
                  <input
                    id="request-demo-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--edge)',
                      color: 'var(--heading)',
                    }}
                    onFocus={(e) => { e.target.style.border = `1px solid ${BRAND}60`; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20`; }}
                    onBlur={(e) => { e.target.style.border = '1px solid var(--edge)'; e.target.style.boxShadow = 'none'; }}
                    disabled={loading}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500" role="alert">{error}</p>
                )}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{ background: BRAND, boxShadow: `0 4px 16px ${BRAND}35` }}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                    : <>Request access <ArrowRight className="w-4 h-4" /></>}
                </motion.button>
              </form>
            )}

            <p className="text-xs mt-6 text-center" style={{ color: 'var(--caption)' }}>
              <Link to="/landing" className="underline hover:opacity-80">Back to home</Link>
              {' · '}
              <Link to="/login" className="underline hover:opacity-80">Sign in</Link>
            </p>
          </motion.div>

          {/* What you get */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: 'All 3 portals', sub: 'Client, Admin & Supplier' },
              { label: 'Sample data', sub: 'Real orders & bids' },
              { label: 'Full features', sub: 'Pipeline & analytics' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3 text-center" style={{ ...glassCard(isDark) }}>
                <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--heading)' }}>{item.label}</p>
                <p className="text-[10px]" style={{ color: 'var(--caption)' }}>{item.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
