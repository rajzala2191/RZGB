import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  X,
} from 'lucide-react';

const ErrorBanner = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
    role="alert"
  >
    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" aria-hidden />
    <span>{message}</span>
  </motion.div>
);

const Spinner = () => (
  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

export default function ForgotPasswordModalView({
  step,
  email,
  otp,
  newPassword,
  confirmPassword,
  showPassword,
  loading,
  error,
  resendCooldown,
  otpLength,
  otpRefs,
  onClose,
  onEmailChange,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  onSendOtp,
  onVerifyOtp,
  onSetPassword,
  onBackToEmail,
  onToggleShowPassword,
}) {
  return (
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-8 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6">
          <img src="/light-logo.png" alt="RZ Global Solutions" className="h-12 object-contain" />
        </div>

        {step === 'email' && (
          <form onSubmit={onSendOtp} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Forgot your password?</h2>
              <p className="text-sm text-slate-500">
                Enter your registered email and we&apos;ll send you a one-time code.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Not receiving the email? Check your spam folder. If you&apos;re an admin, ask your
                project owner to set your password from the Supabase Dashboard (SQL Editor) or User
                Management.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={onEmailChange}
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            {error && <ErrorBanner message={error} />}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-orange-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-orange-500 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Spinner />
              ) : (
                <>
                  <Mail className="w-4 h-4" /> Send Code
                </>
              )}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={onVerifyOtp} className="space-y-5">
            <div>
              <button
                type="button"
                onClick={onBackToEmail}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-orange-400 transition-colors mb-3"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Enter verification code</h2>
              <p className="text-sm text-slate-500">
                We sent a {otpLength}-digit code to{' '}
                <span className="text-orange-400 font-medium">{email}</span>. It expires in 1 hour.
              </p>
            </div>
            <div className="flex justify-between gap-2" onPaste={onOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => onOtpChange(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                  className="w-full aspect-square text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                />
              ))}
            </div>
            {error && <ErrorBanner message={error} />}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-orange-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-orange-500 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Spinner />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Verify Code
                </>
              )}
            </button>
            <div className="text-center">
              {resendCooldown > 0 ? (
                <span className="text-xs text-slate-400">Resend available in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={onSendOtp}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Didn&apos;t receive it? Resend code
                </button>
              )}
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={onSetPassword} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Set new password</h2>
              <p className="text-sm text-slate-500">Choose a strong password for your account.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => onEmailChange(e, 'newPassword')}
                  required
                  autoFocus
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={onToggleShowPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => onEmailChange(e, 'confirmPassword')}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
            {error && <ErrorBanner message={error} />}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-orange-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-orange-500 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Spinner />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Update Password
                </>
              )}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Password updated!</h2>
            <p className="text-sm text-slate-500">
              Your password has been changed. You can now sign in with your new password.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-orange-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-orange-500 hover:to-orange-800 transition-all mt-2"
            >
              <LogIn className="w-4 h-4" /> Back to Sign In
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
