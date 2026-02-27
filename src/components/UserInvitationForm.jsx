import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Building2, UserCog, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const UserInvitationForm = ({ onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    company_name: '',
    role: 'client'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: formData
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Invitation Sent",
        description: `Successfully invited ${formData.email} as a ${formData.role}.`,
        variant: "default",
        className: "bg-green-900 border-green-700 text-white"
      });

      // Reset form
      setFormData({
        email: '',
        company_name: '',
        role: 'client'
      });

      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('Invite Error:', err);
      toast({
        title: "Invitation Failed",
        description: err.message || "Failed to invite user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 shadow-xl"
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-[#FF6B35]" />
          Invite New User
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          Send an invitation email to add a new user to the portal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all placeholder-gray-600"
              placeholder="colleague@company.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Company Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all placeholder-gray-600"
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
            <div className="relative">
              <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="client">Client</option>
                <option value="supplier">Supplier</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-900/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Invite...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Invite
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserInvitationForm;