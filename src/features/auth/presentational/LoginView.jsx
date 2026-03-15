import { useState } from 'react';
import VrocureLogo from '@/components/VrocureLogo';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, ArrowUpRight, Check, Eye, EyeOff, Lock, LogIn, Mail, X, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet';
import ForgotPasswordModalView from '@/features/auth/presentational/ForgotPasswordModalView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { ACCENT, ACCENT_GLOW } from '@/lib/theme';
import { getLandingUrl } from '@/lib/portalConfig';

const BRAND = '#FF6B35';

const FREE_FEATURES = [
  { label: 'RFQ creation & intake',      included: true  },
  { label: 'Order lifecycle tracking',   included: true  },
  { label: 'Document management',        included: true  },
  { label: 'PO creation & PDF export',   included: true  },
  { label: 'Invoice submission',         included: true  },
  { label: 'Competitive bidding engine', included: false },
  { label: 'Spend analytics',            included: false },
  { label: 'Approval workflows',         included: false },
];

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}


export default function LoginView({
  email,
  password,
  loading,
  error,
  profileError,
  showForgotPassword,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onOpenForgotPassword,
  onCloseForgotPassword,
  forgotPasswordProps,
  onGoogleSignIn,
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
        <title>Login — Vrocure</title>
        <meta name="description" content="Sign in to your Vrocure account." />
      </Helmet>

      <div className="min-h-screen flex" style={{ background: 'var(--app-bg)' }}>

        {/* ── Left branding panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-between w-[460px] shrink-0 relative overflow-hidden p-10"
          style={{
            background: isDark
              ? 'linear-gradient(160deg, #1a1010 0%, #111 50%, #0d0d0d 100%)'
              : 'linear-gradient(160deg, #fafaf9 0%, #f5f4f0 50%, #efefeb 100%)',
            borderRight: '1px solid var(--edge)',
          }}
        >
          {/* Gradient orbs */}
          <div className="absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full pointer-events-none"
            style={{ background: 'rgba(255,107,53,0.15)', filter: 'blur(90px)' }} />
          <div className="absolute bottom-[-60px] right-[-60px] w-[240px] h-[240px] rounded-full pointer-events-none"
            style={{ background: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.07)', filter: 'blur(80px)' }} />

          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              opacity: isDark ? 0.04 : 0.06,
              backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'white' : 'black'} 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }} />

          {/* Top: Logo + brand + plan badge */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div style={{ color: 'var(--heading)' }}>
                <VrocureLogo size={40} />
              </div>
              <div>
                <p className="text-lg font-black leading-none" style={{ color: 'var(--heading)' }}>Vrocure</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--caption)' }}>by RZ Global Solutions</p>
              </div>
            </div>

            {/* Free plan badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)' }}>
              <Zap size={11} style={{ color: BRAND }} />
              <span className="text-xs font-bold" style={{ color: BRAND }}>Free Plan · No credit card required</span>
            </div>

            <h2 className="text-2xl font-black leading-tight mb-2" style={{ color: 'var(--heading)' }}>
              Start for free.<br />
              <span style={{ background: `linear-gradient(135deg, ${BRAND}, #fb923c)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Upgrade when ready.
              </span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
              Core procurement workflow included. Unlock advanced features as your team grows.
            </p>
          </div>

          {/* Middle: Free plan feature list */}
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: 'var(--caption)' }}>
              What's included on Free
            </p>
            <div className="space-y-2">
              {FREE_FEATURES.map(({ label, included }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                  className="flex items-center gap-2.5"
                >
                  {included ? (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <Check size={10} style={{ color: '#10b981' }} />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                      <X size={10} style={{ color: 'var(--caption)' }} />
                    </div>
                  )}
                  <span className="text-xs" style={{ color: included ? 'var(--body)' : 'var(--caption)' }}>
                    {label}
                  </span>
                  {!included && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
                      style={{ background: 'rgba(255,107,53,0.12)', color: BRAND }}>
                      PRO
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom: Limits + upgrade link */}
          <div className="relative z-10">
            <div className="grid grid-cols-2 gap-3 mb-4 pt-5" style={{ borderTop: '1px solid var(--edge)' }}>
              {[
                { value: '2', label: 'Users included' },
                { value: '5 / mo', label: 'Orders limit' },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-xl p-3 text-center"
                  style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: '1px solid var(--edge)' }}>
                  <p className="text-base font-black" style={{ color: BRAND }}>{value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--caption)' }}>{label}</p>
                </div>
              ))}
            </div>
            <Link
              to="/pricing"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: isDark ? 'rgba(255,107,53,0.1)' : 'rgba(255,107,53,0.08)',
                border: '1px solid rgba(255,107,53,0.25)',
                color: BRAND,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,53,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,107,53,0.1)' : 'rgba(255,107,53,0.08)'; }}
            >
              View all plans &amp; pricing <ArrowUpRight size={12} />
            </Link>
          </div>
        </motion.div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="relative flex items-center justify-between px-6 py-4">
            <a
              href={getLandingUrl('/')}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--body)' }}
            >
              <ArrowLeft size={16} /> Back to Home
            </a>
            {/* Mobile logo */}
            <div className={`absolute left-1/2 -translate-x-1/2 lg:hidden ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <VrocureLogo size={32} />
            </div>
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
                    Vrocure
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
                {/* Social auth */}
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-80"
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
                  >
                    <GoogleIcon /> Continue with Google
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px" style={{ background: 'var(--edge)' }} />
                  <span className="text-[11px] font-medium" style={{ color: 'var(--caption)' }}>or sign in with email</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--edge)' }} />
                </div>

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
                    {(profileError || error) && (
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
                        <span>{profileError || error}</span>
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

              {/* Sign up nudge */}
              <div className="text-center mt-5">
                <p className="text-xs" style={{ color: 'var(--body)' }}>
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-bold transition-opacity hover:opacity-75"
                    style={{ color: BRAND }}
                  >
                    Sign up free
                  </Link>
                </p>
              </div>

              {/* Footer badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-1.5 mt-4"
              >
                <Zap size={12} style={{ color: 'var(--caption)' }} />
                <p className="text-xs" style={{ color: 'var(--caption)' }}>
                  Vrocure by RZ Global Solutions &nbsp;·&nbsp; &copy; {new Date().getFullYear()} All rights reserved.
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
