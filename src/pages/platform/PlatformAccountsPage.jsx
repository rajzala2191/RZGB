import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Building2, Search, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import PlatformOwnerLayout from '@/components/PlatformOwnerLayout';
import { useToast } from '@/components/ui/use-toast';

const PLAN_OPTIONS = ['beta', 'trial', 'active', 'suspended'];

const planStyle = (status) => {
  const map = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    beta: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    trial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return map[status] || 'bg-slate-700/50 text-slate-400 border-slate-700';
};

const PlatformAccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const { toast } = useToast();

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, company_name, status, created_at')
        .in('role', ['client', 'admin', 'supplier'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
      setFiltered(data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      accounts.filter(a =>
        (a.company_name || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.role || '').toLowerCase().includes(q)
      )
    );
  }, [search, accounts]);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      toast({ title: 'Account updated', description: `Status set to "${newStatus}"` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <PlatformOwnerLayout>
      <Helmet><title>Accounts — Platform Owner</title></Helmet>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

        <div className="flex items-center gap-3">
          <Building2 size={26} className="text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Accounts</h1>
            <p className="text-slate-400 text-sm">Set plan status and manage access for all accounts</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by company, email, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#12121e] border border-amber-500/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/40"
          />
        </div>

        {/* Table */}
        <div className="bg-[#12121e] border border-amber-500/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Company / Email</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Plan Status</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Change Plan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">Loading accounts...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">No accounts found</td></tr>
                ) : filtered.map((account) => (
                  <tr key={account.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-slate-200 font-medium">{account.company_name || '—'}</p>
                      <p className="text-xs text-slate-500">{account.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider bg-slate-700/50 text-slate-300 border-slate-700">
                        {account.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${planStyle(account.status)}`}>
                        {account.status || 'unset'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <select
                          disabled={updating === account.id}
                          value={account.status || ''}
                          onChange={e => updateStatus(account.id, e.target.value)}
                          className="appearance-none bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-amber-500/50 cursor-pointer disabled:opacity-50"
                        >
                          <option value="">— set status —</option>
                          {PLAN_OPTIONS.map(o => (
                            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-slate-800 text-xs text-slate-500">
            {filtered.length} account{filtered.length !== 1 ? 's' : ''} shown
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Plan Status:</span>
          {[
            { label: 'Beta — free early access', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
            { label: 'Trial — time-limited free', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            { label: 'Active — paying customer', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
            { label: 'Suspended — access blocked', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
          ].map(({ label, color }) => (
            <span key={label} className={`px-2 py-0.5 rounded-full border ${color}`}>{label}</span>
          ))}
        </div>

      </motion.div>
    </PlatformOwnerLayout>
  );
};

export default PlatformAccountsPage;
