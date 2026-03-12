import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { submitDemoRequest } from '@/services/demoRequestService';

export default function RequestDemoPage() {
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
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/landing" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--body)' }}>
            ← Back to Home
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="pt-24 pb-16 px-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 sm:p-8 shadow-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)' }}>
            <Mail className="w-6 h-6" style={{ color: 'var(--brand, #FF6B35)' }} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black mb-2" style={{ color: 'var(--heading)' }}>
            Request demo access
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--body)' }}>
            Enter your email and we’ll review your request. Once approved, you’ll receive a link to access the demo. The demo resets to default on every refresh.
          </p>

          {submitted ? (
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)' }}>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>Request received</p>
                <p className="text-xs mt-1" style={{ color: 'var(--body)' }}>
                  We’ll email you at <strong>{email.trim().toLowerCase()}</strong> when your access is approved. Check your inbox (and spam) for the demo link.
                </p>
                <p className="text-xs mt-3" style={{ color: 'var(--caption)' }}>
                  Already have access? Use the link from your approval email to open the demo.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="request-demo-email" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--body)' }}>
                  Email address
                </label>
                <input
                  id="request-demo-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-sm text-red-500" role="alert">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                style={{ background: 'var(--brand, #FF6B35)' }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Request access <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          <p className="text-xs mt-6 text-center" style={{ color: 'var(--caption)' }}>
            <Link to="/landing" className="underline hover:opacity-80">Back to home</Link>
            {' · '}
            <Link to="/login" className="underline hover:opacity-80">Sign in</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}

