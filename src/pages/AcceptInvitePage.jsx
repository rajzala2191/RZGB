import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Wait for Supabase to process the invite token from the URL hash
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (s) {
        setSession(s);
        setSessionLoading(false);
      }
    });

    // Also check for an existing session (in case it was already processed)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
        setSessionLoading(false);
      } else {
        // Give Supabase a moment to process the URL hash tokens
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s2 } }) => {
            if (s2) {
              setSession(s2);
            } else {
              setSessionError('Invite link is invalid or has expired. Please ask an admin to resend the invitation.');
            }
            setSessionLoading(false);
          });
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const passwordStrength = (pw) => {
    if (pw.length === 0) return null;
    if (pw.length < 6) return { label: 'Too short', color: 'text-red-400', bar: 'bg-red-500', width: 'w-1/4' };
    if (pw.length < 8) return { label: 'Weak', color: 'text-orange-400', bar: 'bg-orange-500', width: 'w-2/4' };
    if (!/[0-9]/.test(pw) || !/[A-Z]/.test(pw)) return { label: 'Fair', color: 'text-amber-400', bar: 'bg-amber-500', width: 'w-3/4' };
    return { label: 'Strong', color: 'text-emerald-400', bar: 'bg-emerald-500', width: 'w-full' };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setDone(true);
      toast({ title: 'Password created', description: 'Your account is ready. Please sign in.' });

      // Sign out so the user goes through a clean login
      await supabase.auth.signOut();

      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Password — RZ Global Solutions</title>
      </Helmet>

      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png"
              alt="RZ Global Solutions"
              className="h-20 mx-auto mb-6 object-contain"
            />
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Your Password</h1>
            <p className="text-gray-400">You've been invited to the Ghost Portal. Set a password to activate your account.</p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-[#111111] rounded-xl shadow-2xl p-8 border border-gray-800"
          >
            {/* Loading state — waiting for Supabase to process invite token */}
            {sessionLoading && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-gray-400 text-sm">Verifying your invitation...</p>
              </div>
            )}

            {/* Invalid / expired invite */}
            {!sessionLoading && sessionError && (
              <div className="space-y-4">
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{sessionError}</p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors text-sm"
                >
                  Back to Login
                </button>
              </div>
            )}

            {/* Success state */}
            {done && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Account Activated!</h2>
                <p className="text-gray-400 text-sm">Redirecting you to the login page...</p>
              </div>
            )}

            {/* Password form */}
            {!sessionLoading && !sessionError && !done && session && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email display (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Your Email</label>
                  <div className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700 rounded-lg text-gray-400 text-sm font-mono">
                    {session.user?.email}
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {strength && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.bar} ${strength.width}`} />
                      </div>
                      <p className={`text-xs mt-1 ${strength.color}`}>{strength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Passwords match
                    </p>
                  )}
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
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Activating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Activate Account
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>

          <p className="text-center text-gray-600 text-xs mt-8">
            &copy; {new Date().getFullYear()} RZ Global Solutions. All rights reserved.
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default AcceptInvitePage;
