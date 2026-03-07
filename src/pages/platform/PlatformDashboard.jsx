import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, Building2, Briefcase, TrendingUp, Clock, Crown } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import PlatformOwnerLayout from '@/components/PlatformOwnerLayout';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, sub }) => (
  <div className="bg-[#12121e] border border-amber-500/10 rounded-xl p-6 hover:border-amber-500/30 transition-all group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-slate-100 mt-2">{value}</h3>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 group-hover:scale-110 transition-transform">
        <Icon size={22} className="text-amber-400" />
      </div>
    </div>
  </div>
);

const PlatformDashboard = () => {
  const [stats, setStats] = useState({ clients: 0, suppliers: 0, admins: 0, total: 0, orders: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profilesRes, ordersRes, recentRes] = await Promise.all([
          supabase.from('profiles').select('role, created_at, status'),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id, email, role, company_name, status, created_at').order('created_at', { ascending: false }).limit(8),
        ]);

        if (profilesRes.data) {
          const d = profilesRes.data;
          setStats({
            clients: d.filter(p => p.role === 'client').length,
            suppliers: d.filter(p => p.role === 'supplier').length,
            admins: d.filter(p => p.role === 'admin').length,
            total: d.length,
            orders: ordersRes.count || 0,
          });
        }

        if (recentRes.data) setRecentUsers(recentRes.data);
      } catch (err) {
        console.error('PlatformDashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const roleBadge = (role) => {
    const map = {
      client: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      supplier: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      admin: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      platform_owner: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${map[role] || 'bg-slate-700 text-slate-300'}`}>
        {role}
      </span>
    );
  };

  return (
    <PlatformOwnerLayout>
      <Helmet><title>Platform Owner — RZ Global Solutions</title></Helmet>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Crown size={28} className="text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Platform Overview</h1>
            <p className="text-slate-400 text-sm">Full visibility across all tenants and accounts</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Clients" value={loading ? '—' : stats.clients} icon={Building2} sub="Active tenant accounts" />
          <StatCard title="Suppliers" value={loading ? '—' : stats.suppliers} icon={Users} sub="Registered suppliers" />
          <StatCard title="Admins" value={loading ? '—' : stats.admins} icon={Crown} sub="Ops team members" />
          <StatCard title="Total Orders" value={loading ? '—' : stats.orders} icon={Briefcase} sub="All time" />
        </div>

        {/* Recent Signups */}
        <div className="bg-[#12121e] border border-amber-500/10 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-amber-500/10">
            <Clock size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Recent Signups</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Company / Email</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Plan Status</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : recentUsers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No users yet</td></tr>
                ) : recentUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-slate-200 font-medium">{u.company_name || '—'}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">{roleBadge(u.role)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${
                        u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        u.status === 'beta' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        u.status === 'trial' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        u.status === 'suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-slate-700/50 text-slate-400 border-slate-700'
                      }`}>
                        {u.status || 'unset'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Manage Accounts', desc: 'Set plan status, grant or revoke access', href: '/platform/accounts', color: 'blue' },
            { label: 'Manage Users', desc: 'Create users with any role', href: '/platform/users', color: 'emerald' },
            { label: 'System Health', desc: 'DB stats and platform diagnostics', href: '/platform/system', color: 'amber' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="bg-[#12121e] border border-amber-500/10 hover:border-amber-500/30 rounded-xl p-5 transition-all group"
            >
              <p className="text-slate-200 font-semibold group-hover:text-amber-400 transition-colors">{link.label}</p>
              <p className="text-xs text-slate-500 mt-1">{link.desc}</p>
            </a>
          ))}
        </div>

      </motion.div>
    </PlatformOwnerLayout>
  );
};

export default PlatformDashboard;
