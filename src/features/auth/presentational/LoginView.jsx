import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Globe, Lock, LogIn, Mail, Package, Shield, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet';
import ForgotPasswordModalView from '@/features/auth/presentational/ForgotPasswordModalView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { ACCENT, ACCENT_GLOW } from '@/lib/theme';

const FEATURES = [
  { icon: Globe, label: 'Global Sourcing', desc: 'Connect with vetted Tier 1 & Tier 2 suppliers worldwide' },
  { icon: Package, label: 'Order Tracking', desc: 'Real-time visibility across your entire supply chain' },
  { icon: Shield, label: 'Secure & Compliant', desc: 'Enterprise-grade security for every transaction' },
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

  return (
    <>
      <Helmet>
        <title>Login - RZ Global Solutions</title>
        <meta name="description" content="Access your RZ Global Solutions account." />
      </Helmet>

      <div
        className="min-h-screen flex"
        style={{ background: 'var(--app-bg)' }}
      >
        {/* ── Left branding panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 relative overflow-hidden p-10"
          style={{
            background: isDark
              ? 'linear-gradient(160deg, #1a1a1a 0%, #111 60%, #0a0a0a 100%)'
              : 'linear-gradient(160deg, #1c1c1e 0%, #111 100%)',
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'}`,
          }}
        >
          {/* Background glow blobs */}
          <div
            className="absolute top-[-80px] left-[-80px] w-[320px] h-[320px] rounded-full pointer-events-none"
            style={{ background: ACCENT_GLOW, filter: 'blur(80px)' }}
          />
          <div
            className="absolute bottom-[-60px] right-[-60px] w-[240px] h-[240px] rounded-full pointer-events-none"
            style={{ background: 'rgba(99,102,241,0.1)', filter: 'blur(80px)' }}
          />

          {/* Top: Logo + brand */}
          <div className="relative z-10">
            <img
              src="/light-logo.png"
              alt="RZ Global Solutions"
              className="h-14 object-contain mb-8"
            />
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Procurement.<br />
              <span style={{ color: ACCENT }}>Simplified.</span>
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
                <div
                  className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ background: ACCENT_GLOW, border: `1px solid ${ACCENT}30` }}
                >
                  <Icon size={16} style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom: Stats bar */}
          <div
            className="relative z-10 grid grid-cols-3 gap-3 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[
              { value: '500+', label: 'Suppliers' },
              { value: '99.9%', label: 'Uptime' },
              { value: '40+', label: 'Countries' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-lg font-bold" style={{ color: ACCENT }}>{value}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex flex-col">
          {/* Top bar with theme toggle */}
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile logo */}
            <img
              src="/light-logo.png"
              alt="RZ Global Solutions"
              className="h-8 object-contain lg:hidden"
            />
            <div className="hidden lg:block" />
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
                <h1
                  className="text-2xl font-bold mb-1.5 tracking-tight"
                  style={{ color: 'var(--heading)' }}
                >
                  Welcome back
                </h1>
                <p className="text-sm" style={{ color: 'var(--body)' }}>
                  Sign in to your RZ Global Solutions account
                </p>
              </div>

              {/* Card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="rounded-2xl p-7 shadow-xl"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--edge)',
                  boxShadow: isDark
                    ? '0 8px 40px rgba(0,0,0,0.4)'
                    : '0 8px 40px rgba(0,0,0,0.08)',
                }}
              >
                <form onSubmit={onSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: 'var(--body)' }}
                    >
                      Email
                    </label>
                    <div className="relative group">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors"
                        style={{ color: 'var(--caption)' }}
                      />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={onEmailChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                        style={{
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--edge)',
                          color: 'var(--heading)',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = `1px solid ${ACCENT}`;
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT_GLOW}`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid var(--edge)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: 'var(--body)' }}
                    >
                      Password
                    </label>
                    <div className="relative group">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors"
                        style={{ color: 'var(--caption)' }}
                      />
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={onPasswordChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                        style={{
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--edge)',
                          color: 'var(--heading)',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = `1px solid ${ACCENT}`;
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT_GLOW}`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid var(--edge)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        placeholder="••••••••"
                      />
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
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full font-semibold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT} 0%, #f97316 100%)`,
                      color: '#fff',
                      boxShadow: `0 4px 20px ${ACCENT_GLOW}`,
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Authenticating...</span>
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
                      onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--caption)')}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </motion.div>

              {/* Security badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-1.5 mt-6"
              >
                <Zap size={12} style={{ color: 'var(--caption)' }} />
                <p className="text-xs" style={{ color: 'var(--caption)' }}>
                  Secured by RZ Global &nbsp;·&nbsp; &copy; {new Date().getFullYear()} All rights reserved.
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
