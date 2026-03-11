import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Lock, LogIn, Mail } from 'lucide-react';
import { Helmet } from 'react-helmet';
import ForgotPasswordModalView from '@/features/auth/presentational/ForgotPasswordModalView';

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
  return (
    <>
      <Helmet>
        <title>Login - RZ Global Solutions</title>
        <meta name="description" content="Access your RZ Global Solutions account." />
      </Helmet>

      <div className="min-h-screen bg-[#f8f8fb] flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-400/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <img
              src="/light-logo.png"
              alt="RZ Global Solutions Logo"
              className="h-20 mx-auto mb-6 object-contain"
            />
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              RZ Global Solutions
            </h1>
            <p className="text-slate-500">Secure access portal for clients & suppliers</p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-8 border border-slate-200"
          >
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={onEmailChange}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={onPasswordChange}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" aria-hidden />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-orange-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-orange-500 hover:to-orange-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </>
                )}
              </motion.button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-xs text-slate-400 hover:text-orange-500 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          </motion.div>

          <p className="text-center text-slate-400 text-xs mt-8">
            &copy; {new Date().getFullYear()} RZ Global Solutions. All rights reserved.
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {showForgotPassword && (
          <ForgotPasswordModalView {...forgotPasswordProps} onClose={onCloseForgotPassword} />
        )}
      </AnimatePresence>
    </>
  );
}
