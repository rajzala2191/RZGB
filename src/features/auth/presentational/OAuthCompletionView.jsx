import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, Building2, Globe, Phone, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import VrocureLogo from '@/components/VrocureLogo';

const BRAND = '#FF6B35';

export default function OAuthCompletionView({
  name,
  businessName,
  phone,
  website,
  loading,
  error,
  onBusinessNameChange,
  onPhoneChange,
  onWebsiteChange,
  onSubmit,
}) {
  const { isDark } = useTheme();

  const glassCard = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--surface)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--edge)',
    boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08)',
  };

  const inputStyle = {
    background: 'var(--surface-raised)',
    border: '1px solid var(--edge)',
    color: 'var(--heading)',
  };

  const handleFocus = (e) => {
    e.currentTarget.style.border = `1px solid ${BRAND}70`;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND}20`;
  };
  const handleBlur = (e) => {
    e.currentTarget.style.border = '1px solid var(--edge)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <>
      <Helmet>
        <title>Finish Setup — Vrocure</title>
      </Helmet>

      <div className="min-h-screen flex flex-col" style={{ background: 'var(--app-bg)' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div style={{ color: 'var(--heading)' }}>
            <VrocureLogo size={30} />
          </div>
          <ThemeToggle />
        </div>

        {/* Centered card */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
          >
            {/* Header */}
            <div className="mb-7 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)' }}>
                <Zap size={11} style={{ color: BRAND }} />
                <span className="text-xs font-bold" style={{ color: BRAND }}>Almost there!</span>
              </div>
              <h1 className="text-2xl font-black mb-1.5" style={{ color: 'var(--heading)' }}>
                Set up your workspace
              </h1>
              {name && (
                <p className="text-sm" style={{ color: 'var(--body)' }}>
                  Welcome, <span className="font-semibold" style={{ color: 'var(--heading)' }}>{name}</span>. Just a few details to get started.
                </p>
              )}
            </div>

            {/* Glass card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-7 backdrop-blur-sm"
              style={{ ...glassCard, borderTop: `3px solid ${BRAND}` }}
            >
              <form onSubmit={onSubmit} className="space-y-5">
                {/* Business Name */}
                <div>
                  <label htmlFor="businessName" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--body)' }}>
                    Business Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--caption)' }} />
                    <input
                      id="businessName"
                      type="text"
                      value={businessName}
                      onChange={onBusinessNameChange}
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      placeholder="Acme Ltd"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--body)' }}>
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--caption)' }} />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={onPhoneChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      placeholder="+44 7700 000000"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--body)' }}>
                    Website{' '}
                    <span style={{ color: 'var(--caption)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--caption)' }} />
                    <input
                      id="website"
                      type="text"
                      value={website}
                      onChange={onWebsiteChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      placeholder="example.com"
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
                      <span>Setting up workspace…</span>
                    </>
                  ) : (
                    <>
                      <span>Finish Setup</span>
                      <ArrowRight className="h-4 w-4 ml-auto opacity-60" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            <p className="text-center text-xs mt-5" style={{ color: 'var(--caption)' }}>
              Vrocure by RZ Global Solutions &nbsp;·&nbsp; &copy; {new Date().getFullYear()}
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
