import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Building2, UserCog, Send, Loader2, Shield, User, Truck } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const ROLES = [
  { value: 'client', label: 'Client', icon: User, desc: 'Can create & track orders', color: 'border-orange-500/40 bg-orange-500/5 text-orange-400' },
  { value: 'supplier', label: 'Supplier', icon: Truck, desc: 'Can bid & manage jobs', color: 'border-blue-500/40 bg-blue-500/5 text-blue-400' },
  { value: 'admin', label: 'Admin', icon: Shield, desc: 'Full system access', color: 'border-orange-500/40 bg-orange-500/5 text-orange-400' },
];

const InviteUserModal = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', company_name: '', role: 'client' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', { body: form });
      if (error) {
        // Extract the real error message from the edge function response body
        const body = await error.context?.json?.().catch(() => null);
        throw new Error(body?.error || error.message);
      }
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Invitation Sent',
        description: `${form.email} has been invited as a ${form.role}.`,
        className: 'bg-green-900 border-green-700 text-white',
      });
      setForm({ email: '', company_name: '', role: 'client' });
      onSuccess();
      onClose();
    } catch (err) {
      toast({ title: 'Invitation Failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Send size={18} className="text-orange-400" />
                Invite New User
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">They'll receive an email to set their password.</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@company.com"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={form.company_name}
                  onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="Acme Manufacturing Ltd"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, icon: Icon, desc, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: value }))}
                    className={`
                      p-3 rounded-xl border text-center transition-all duration-200
                      ${form.role === value ? color : 'border-slate-700 bg-slate-800/30 text-slate-500 hover:border-slate-600'}
                    `}
                  >
                    <Icon size={18} className="mx-auto mb-1.5" />
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5 leading-tight">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Sending...</>
              ) : (
                <><Send size={15} /> Send Invitation</>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
};

export default InviteUserModal;
