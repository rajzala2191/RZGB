import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Globe, Lock, LogIn, Mail, Package, Shield, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet';
import ForgotPasswordModalView from '@/features/auth/presentational/ForgotPasswordModalView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { ACCENT, ACCENT_GLOW } from '@/lib/theme';

const BRAND = '#FF6B35';

const FEATURES = [
  { icon: Globe,   label: 'Global Sourcing',   desc: 'Connect with vetted Tier 1 & Tier 2 suppliers worldwide' },
  { icon: Package, label: 'Order Tracking',    desc: 'Real-time visibility across your entire supply chain' },
  { icon: Shield,  label: 'Secure & Compliant', desc: 'Enterprise-grade security for every transaction' },
];

export default function LoginView({
  email,
  password,
  loading,
  error,
  showForgotPassword,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onOpenForgotPassword,
  onCloseForgotPassword,
  forgotPasswordProps,
}) {
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const glassCard = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--surface)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--edge)',
    boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08)',
  };

  return (
    <>
      <Helmet>
        <title>Login — Zaproc</title>
        <meta name="description" content="Sign in to your Zaproc account." />
      </Helmet>

      <div className="min-h-screen flex" style={{ background: 'var(--app-bg)' }}>

        {/* ── Left branding panel (always dark) ── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-between w-[460px] shrink-0 relative overflow-hidden p-10"
          style={{
            background: 'linear-gradient(160deg, #1a1010 0%, #111 50%, #0d0d0d 100%)',
            borderRight: '1px solid rgba(255,107,53,0.12)',
          }}
        >
          {/* Gradient orbs */}
          <div className="absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full pointer-events-none"
            style={{ background: 'rgba(255,107,53,0.15)', filter: 'blur(90px)' }} />
          <div className="absolute bottom-[-60px] right-[-60px] w-[240px] h-[240px] rounded-full pointer-events-none"
            style={{ background: 'rgba(139,92,246,0.12)', filter: 'blur(80px)' }} />
          <div className="absolute top-[40%] right-[-40px] w-[180px] h-[180px] rounded-full pointer-events-none"
            style={{ background: 'rgba(59,130,246,0.08)', filter: 'blur(60px)' }} />

          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          {/* Top: Logo + brand */}
          <div className="relative z-10">
            {/* Logo mark inverted (panel is always dark) */}
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/zaproc-logo-192.png"
                alt="Zaproc"
                className="h-10 w-10 object-contain rounded-xl"
                style={{ filter: 'brightness(0) invert(1)', opacity: 0.92 }}
              />
              <div>
                <p className="text-lg font-black text-white leading-none">Zaproc</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>by RZ Global Solutions</p>
              </div>
            </div>

            <h2 className="text-3xl font-black text-white leading-tight mb-3">
              Procurement.<br />
              <span style={{ background: `linear-gradient(135deg, ${BRAND}, #fb923c)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Simplified.
              </span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              The end-to-end platform for managing global supply chains — from sourcing to delivery.
            </p>
          </div>

          {/* Middle: Feature list */}
          <div className="relative z-10 space-y-5">
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="flex items-start gap-3"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.25)' }}>
                  <Icon size={16} style={{ color: BRAND }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom: Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-3 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { value: '500+', label: 'Suppliers' },
              { value: '99.9%', label: 'Uptime' },
              { value: '40+', label: 'Countries' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-lg font-bold" style={{ color: BRAND }}>{value}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="relative flex items-center justify-between px-6 py-4">
            <Link
              to="/landing"
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--body)' }}
            >
              <ArrowLeft size={16} /> Back to Home
            </Link>
            {/* Mobile logo */}
            <img
              src="/zaproc-logo-192.png"
              alt="Zaproc"
              className="h-8 w-8 object-contain rounded-lg absolute left-1/2 -translate-x-1/2 lg:hidden"
              style={isDark ? { filter: 'brightness(0) invert(1)', opacity: 0.9 } : {}}
            />
            <ThemeToggle />
          </div>

          {/* Centered form */}
          <div className="flex-1 flex items-center justify-center px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full max-w-sm"
            >
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-2xl font-black mb-1.5 tracking-tight" style={{ color: 'var(--heading)' }}>
                  Welcome back
                </h1>
                <p className="text-sm" style={{ color: 'var(--body)' }}>
                  Sign in to your{' '}
                  <span style={{ background: `linear-gradient(135deg, ${BRAND}, #fb923c)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700 }}>
                    Zaproc
                  </span>{' '}
                  account
                </p>
              </div>

              {/* Glass card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="rounded-2xl p-7 backdrop-blur-sm"
                style={{ ...glassCard, borderTop: `3px solid ${BRAND}` }}
              >
                <form onSubmit={onSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--body)' }}>
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--caption)' }} />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={onEmailChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                        style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
                        onFocus={(e) => { e.currentTarget.style.border = `1px solid ${BRAND}70`; e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND}20`; }}
                        onBlur={(e) => { e.currentTarget.style.border = '1px solid var(--edge)'; e.currentTarget.style.boxShadow = 'none'; }}
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--body)' }}>
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--caption)' }} />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={onPasswordChange}
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                        style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
                        onFocus={(e) => { e.currentTarget.style.border = `1px solid ${BRAND}70`; e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND}20`; }}
                        onBlur={(e) => { e.currentTarget.style.border = '1px solid var(--edge)'; e.currentTarget.style.boxShadow = 'none'; }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none"
                        style={{ color: 'var(--caption)' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm"
                        style={{
                          background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: isDark ? '#fca5a5' : '#b91c1c',
                        }}
                        role="alert"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND} 0%, #f97316 100%)`,
                      boxShadow: `0 4px 20px ${BRAND}40`,
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Authenticating…</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" />
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4 ml-auto opacity-60" />
                      </>
                    )}
                  </motion.button>

                  {/* Forgot password */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={onOpenForgotPassword}
                      className="text-xs transition-colors"
                      style={{ color: 'var(--caption)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = BRAND)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--caption)')}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </motion.div>

              {/* Footer badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-1.5 mt-6"
              >
                <Zap size={12} style={{ color: 'var(--caption)' }} />
                <p className="text-xs" style={{ color: 'var(--caption)' }}>
                  Zaproc by RZ Global Solutions &nbsp;·&nbsp; &copy; {new Date().getFullYear()} All rights reserved.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForgotPassword && (
          <ForgotPasswordModalView {...forgotPasswordProps} onClose={onCloseForgotPassword} />
        )}
      </AnimatePresence>
    </>
  );
}
