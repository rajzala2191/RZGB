import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, X, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

// ─── Forgot Password Modal ───────────────────────────────────────────────────

const ForgotPasswordModal = ({ onClose }) => {
  const OTP_LENGTH = Number(import.meta.env.VITE_EMAIL_OTP_LENGTH || 6);
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'password' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = React.useRef([]);

  const mapOtpError = (err, fallback) => {
    const message = (err?.message || '').toLowerCase();
    if (message.includes('rate limit') || message.includes('too many') || message.includes('security purposes')) {
      return 'Too many attempts. Please wait 60 seconds and try again.';
    }
    if (message.includes('invalid login credentials') || message.includes('user not found')) {
      return 'No account found for this email address.';
    }
    return err?.message || fallback;
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Forgot-password OTP flow via Supabase recovery template.
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase()
      );
      if (err) throw err;
      setStep('otp');
      setResendCooldown(60);
    } catch (err) {
      setError(mapOtpError(err, 'Failed to send code. Please check the email address.'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (text.length === OTP_LENGTH) {
      setOtp(text.split(''));
      otpRefs.current[OTP_LENGTH - 1]?.focus();
    }
    e.preventDefault();
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const token = otp.join('');
    if (token.length < OTP_LENGTH) {
      setError(`Please enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'recovery',
      });
      if (err) throw err;
      setStep('password');
    } catch (err) {
      setError(mapOtpError(err, 'Invalid or expired code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e?.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      if (err) throw err;
      await supabase.auth.signOut();
      setStep('done');
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-8 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6">
          <img src="/light-logo.png" alt="RZ Global Solutions" className="h-12 object-contain" />
        </div>

        {/* ── STEP: Email ── */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Forgot your password?</h2>
              <p className="text-sm text-slate-500">Enter your registered email and we&apos;ll send you a one-time code.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              {loading ? <Spinner /> : <><Mail className="w-4 h-4" /> Send Code</>}
            </button>
          </form>
        )}

        {/* ── STEP: OTP ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                  setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
                }}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-orange-400 transition-colors mb-3"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Enter verification code</h2>
              <p className="text-sm text-slate-500">
                We sent a {OTP_LENGTH}-digit code to <span className="text-orange-400 font-medium">{email}</span>. It expires in 1 hour.
              </p>
            </div>
            <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
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
              {loading ? <Spinner /> : <><KeyRound className="w-4 h-4" /> Verify Code</>}
            </button>
            <div className="text-center">
              {resendCooldown > 0 ? (
                <span className="text-xs text-slate-400">Resend available in {resendCooldown}s</span>
              ) : (
                <button type="button" onClick={handleSendOtp} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                  Didn&apos;t receive it? Resend code
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── STEP: New Password ── */}
        {step === 'password' && (
          <form onSubmit={handleSetPassword} className="space-y-5">
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
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                  placeholder="Minimum 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? <Spinner /> : <><CheckCircle2 className="w-4 h-4" /> Update Password</>}
            </button>
          </form>
        )}

        {/* ── STEP: Done ── */}
        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Password updated!</h2>
            <p className="text-sm text-slate-500">Your password has been changed. You can now sign in with your new password.</p>
            <button
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
};

const ErrorBanner = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
  >
    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
    <span>{message}</span>
  </motion.div>
);

const Spinner = () => (
  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

// ─── Login Page ──────────────────────────────────────────────────────────────

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser, userRole } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(location.state?.error || '');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // If Supabase redirected an invite link to this page (redirectTo not whitelisted),
  // forward to /create-password preserving the hash so the session can be processed.
  useEffect(() => {
    if (window.location.hash.includes('type=invite')) {
      navigate('/create-password' + window.location.hash, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    // Don't redirect while the forgot-password modal is open.
    if (showForgotPassword) return;
    if (currentUser && userRole) {
      if (userRole === 'admin') navigate('/control-centre', { replace: true });
      else if (userRole === 'client') navigate('/client-dashboard', { replace: true });
      else if (userRole === 'supplier') navigate('/supplier-hub', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [currentUser, userRole, navigate, showForgotPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await login(email, password);

      if (error) {
        setError(error.message || 'Invalid email or password');
        toast({
          title: "Login Failed",
          description: error.message || "Please check your credentials and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome Back",
          description: "Successfully logged in to RZ Portal.",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">RZ Global Solutions</h1>
            <p className="text-slate-500">Secure access portal for clients & suppliers</p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-8 border border-slate-200"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
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
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                  onClick={() => setShowForgotPassword(true)}
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
          <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default LoginPage;
