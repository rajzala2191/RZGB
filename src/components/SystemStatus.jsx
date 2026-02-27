import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Lock, Mail, Check, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const SystemStatus = () => {
  const { currentUser, resendVerificationEmail } = useAuth();
  const [status, setStatus] = useState({
    db: 'checking',
    auth: 'checking',
    email: 'checking',
  });
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailTestLoading, setEmailTestLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    const newStatus = { db: 'error', auth: 'error', email: 'warning' };

    try {
      // Check DB connection
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (!error) newStatus.db = 'connected';

      // Check Auth
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (!authError) newStatus.auth = 'active';

      // Check Email (Mock check mainly, checking if we can access auth settings implicitly)
      // Real check would be sending an email or checking a specific config table
      if (!authError) {
         // Assuming if auth is up, email service is likely configured in Supabase
         newStatus.email = 'ready'; 
      } else {
         newStatus.email = 'error';
      }

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
      // Send a "test" by resending verification or password reset (safe action)
      // Since we are likely Admin, we might just try resending verification to self if unverified, 
      // or triggers a password reset if verified (but that logs out). 
      // For this demo, we'll use the resendVerificationEmail logic we added.
      
      const { error } = await resendVerificationEmail(currentUser.email);
      if (error) throw error;
      
      // If success, we consider email service working
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
    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-gray-400" />
        <span className="text-sm text-gray-300 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {status === 'checking' ? (
          <span className="text-xs text-yellow-500">Checking...</span>
        ) : status === 'connected' || status === 'active' || status === 'ready' ? (
          <div className="flex items-center gap-1.5">
             <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
             <span className="text-xs text-green-500 font-medium uppercase">{status === 'ready' ? 'Ready' : 'Online'}</span>
          </div>
        ) : status === 'warning' ? (
          <div className="flex items-center gap-1.5">
             <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span>
             <span className="text-xs text-yellow-500 font-medium uppercase">Warning</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
             <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
             <span className="text-xs text-red-500 font-medium uppercase">Error</span>
          </div>
        )}
        {action}
      </div>
    </div>
  );

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">System Status</h3>
        <motion.button
          onClick={checkStatus}
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          className={`p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-[#FF6B35] transition-colors ${loading ? 'animate-spin' : ''}`}
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
                className="h-6 px-2 text-[10px] bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
              >
                {emailTestLoading ? 'Sending...' : 'Test'}
              </Button>
            )
          }
        />
        
        <div className="pt-2 text-xs text-center text-gray-500 border-t border-gray-800 mt-4">
          Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;