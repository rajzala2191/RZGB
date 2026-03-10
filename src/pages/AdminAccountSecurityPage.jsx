import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Clock, Smartphone, LogOut, Loader2 } from 'lucide-react';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import AccountSecuritySection from '@/components/AccountSecuritySection';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const AdminAccountSecurityPage = () => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessions([{
            id: 'current',
            created_at: session.user?.last_sign_in_at,
            isCurrent: true,
          }]);
        }
      } catch { /* ignore */ } finally {
        setSessionsLoading(false);
      }
    };
    loadSessions();
  }, []);

  const handleSignOutAll = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast({ title: 'Signed out everywhere', description: 'All sessions have been terminated. Redirecting to login...' });
      setTimeout(() => logout(), 1500);
    } catch (err) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <ControlCentreLayout>
      <Helmet><title>Account Security - RZ Control Centre</title></Helmet>

      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Shield size={28} className="text-[#FF6B35]" />
            Account Security
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your password, email address, and active sessions.</p>
        </motion.div>

        <AccountSecuritySection variant="light" />

        {/* Active sessions */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
              <Smartphone size={18} className="text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Active Sessions</h3>
              <p className="text-xs text-slate-500">View and manage where you're signed in.</p>
            </div>
          </div>

          {sessionsLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
              <Loader2 size={16} className="animate-spin" /> Loading sessions...
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-800 font-medium">Current session</p>
                      {s.created_at && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> Signed in {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">Active</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSignOutAll}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all"
          >
            <LogOut size={15} /> Sign out all devices
          </button>
        </div>
      </div>
    </ControlCentreLayout>
  );
};

export default AdminAccountSecurityPage;
