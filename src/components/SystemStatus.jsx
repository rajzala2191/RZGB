import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Lock, Mail } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const SystemStatus = () => {
  const { currentUser, resendVerificationEmail } = useAuth();
  const [status, setStatus] = useState({ db: 'checking', auth: 'checking', email: 'checking' });
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailTestLoading, setEmailTestLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    const newStatus = { db: 'error', auth: 'error', email: 'warning' };
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (!error) newStatus.db = 'connected';
      const { error: authError } = await supabase.auth.getSession();
      if (!authError) { newStatus.auth = 'active'; newStatus.email = 'ready'; } else { newStatus.email = 'error'; }
      setStatus(newStatus);
      setLastSync(new Date());
    } catch (e) {
      console.error('System status check failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!currentUser) return;
    setEmailTestLoading(true);
    try {
      const { error } = await resendVerificationEmail(currentUser.email);
      if (error) throw error;
      setStatus(prev => ({ ...prev, email: 'active' }));
    } catch (e) {
      console.error('Email test failed', e);
      setStatus(prev => ({ ...prev, email: 'error' }));
    } finally {
      setEmailTestLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const StatusItem = ({ label, status, icon: Icon, action }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-slate-400" />
        <span className="text-sm text-slate-700 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {status === 'checking' ? (
          <span className="text-xs text-yellow-600">Checking...</span>
        ) : status === 'connected' || status === 'active' || status === 'ready' ? (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <span className="text-xs text-green-600 font-medium uppercase">{status === 'ready' ? 'Ready' : 'Online'}</span>
          </div>
        ) : status === 'warning' ? (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
            <span className="text-xs text-yellow-600 font-medium uppercase">Warning</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
            <span className="text-xs text-red-500 font-medium uppercase">Error</span>
          </div>
        )}
        {action}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">System Status</h3>
        <motion.button
          onClick={checkStatus}
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          className={`p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-[#FF6B35] transition-colors ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </motion.button>
      </div>

      <div className="space-y-3">
        <StatusItem label="Database" status={status.db} icon={Database} />
        <StatusItem label="Auth Services" status={status.auth} icon={Lock} />
        <StatusItem
          label="Email Gateway"
          status={status.email}
          icon={Mail}
          action={
            currentUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTestEmail}
                disabled={emailTestLoading}
                className="h-6 px-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              >
                {emailTestLoading ? 'Sending...' : 'Test'}
              </Button>
            )
          }
        />
        <div className="pt-2 text-xs text-center text-slate-400 border-t border-slate-200 mt-4">
          Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
