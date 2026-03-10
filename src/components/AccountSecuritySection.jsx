import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, Loader2, Check, AlertCircle, KeyRound, Shield } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AccountSecuritySection = ({ variant = 'light' }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const [emailForm, setEmailForm] = useState({ newEmail: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [emailError, setEmailError] = useState('');

  const isDark = variant === 'dark';

  const cardCls = isDark
    ? 'bg-[#1a1a1a] border border-gray-800 rounded-xl p-6'
    : 'bg-white border border-slate-200 rounded-xl p-6 shadow-sm';

  const inputCls = isDark
    ? 'w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all'
    : 'w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all';

  const labelCls = isDark ? 'text-sm font-medium text-gray-400 mb-1.5 block' : 'text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block';
  const headingCls = isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900';
  const subCls = isDark ? 'text-xs text-gray-500' : 'text-xs text-slate-500';
  const errorCls = isDark
    ? 'bg-red-900/40 border border-red-500/70 text-red-300 px-3 py-2 rounded-lg text-sm'
    : 'bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm';
  const successCls = isDark
    ? 'bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 px-3 py-2 rounded-lg text-sm'
    : 'bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-sm';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('New passwords do not match.'); return; }
    setPwLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: pwForm.current,
      });
      if (signInErr) {
        setPwError('Current password is incorrect.');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
      if (error) throw error;
      setPwDone(true);
      setPwForm({ current: '', newPw: '', confirm: '' });
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setTimeout(() => setPwDone(false), 4000);
    } catch (err) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailError('');
    const trimmed = emailForm.newEmail.trim().toLowerCase();
    if (!trimmed || trimmed === currentUser?.email) { setEmailError('Please enter a different email address.'); return; }
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      setEmailDone(true);
      setEmailForm({ newEmail: '' });
      toast({ title: 'Confirmation sent', description: 'A confirmation link has been sent to your new email. Check your inbox (and spam) to confirm the change.' });
      setTimeout(() => setEmailDone(false), 6000);
    } catch (err) {
      setEmailError(err.message || 'Failed to change email.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className={cardCls}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <KeyRound size={18} className="text-orange-500" />
          </div>
          <div>
            <h3 className={headingCls}>Change Password</h3>
            <p className={subCls}>Update your account password. You'll need your current password.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className={labelCls}>Current Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                required
                className={inputCls}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>New Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.newPw}
                onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                required
                minLength={8}
                className={inputCls}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Confirm New Password</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              required
              className={inputCls}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>

          <AnimatePresence>
            {pwError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={errorCls} role="alert">
                <AlertCircle size={14} className="inline mr-1.5 -mt-0.5" />{pwError}
              </motion.div>
            )}
            {pwDone && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={successCls}>
                <Check size={14} className="inline mr-1.5 -mt-0.5" />Password changed successfully.
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={pwLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-all disabled:opacity-50 shadow-sm"
          >
            {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            Update Password
          </button>
        </form>
      </div>

      {/* Change Email */}
      <div className={cardCls}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Mail size={18} className="text-blue-500" />
          </div>
          <div>
            <h3 className={headingCls}>Change Email Address</h3>
            <p className={subCls}>A confirmation will be sent to your new email. You'll need to verify it before the change takes effect.</p>
          </div>
        </div>

        <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
          <div>
            <label className={labelCls}>Current Email</label>
            <input type="email" value={currentUser?.email || ''} disabled className={inputCls + ' opacity-50 cursor-not-allowed'} />
          </div>
          <div>
            <label className={labelCls}>New Email Address</label>
            <input
              type="email"
              value={emailForm.newEmail}
              onChange={e => setEmailForm({ newEmail: e.target.value })}
              required
              className={inputCls}
              placeholder="newemail@company.com"
            />
          </div>

          <AnimatePresence>
            {emailError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={errorCls} role="alert">
                <AlertCircle size={14} className="inline mr-1.5 -mt-0.5" />{emailError}
              </motion.div>
            )}
            {emailDone && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={successCls}>
                <Check size={14} className="inline mr-1.5 -mt-0.5" />Confirmation sent. Check your new email's inbox and spam folder.
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={emailLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 shadow-sm"
          >
            {emailLoading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
            Update Email
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSecuritySection;
