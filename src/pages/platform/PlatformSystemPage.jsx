import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Activity, Database, Users, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import PlatformOwnerLayout from '@/components/PlatformOwnerLayout';

const MetricCard = ({ label, value, icon: Icon, status }) => (
  <div className="bg-[#12121e] border border-amber-500/10 rounded-xl p-5">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
      </div>
      <div className={`p-2.5 rounded-lg ${status === 'ok' ? 'bg-emerald-500/10' : status === 'warn' ? 'bg-amber-500/10' : 'bg-slate-800'}`}>
        <Icon size={18} className={status === 'ok' ? 'text-emerald-400' : status === 'warn' ? 'text-amber-400' : 'text-slate-400'} />
      </div>
    </div>
  </div>
);

const PlatformSystemPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [profilesRes, ordersRes, logsRes, activitiesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }),
        supabase.from('activity_logs')
          .select('action, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setMetrics({
        totalUsers: profilesRes.count ?? '—',
        totalOrders: ordersRes.count ?? '—',
        totalLogs: logsRes.count ?? '—',
        recentActivity: activitiesRes.data || [],
        dbStatus: !profilesRes.error ? 'ok' : 'error',
      });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('System health fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  return (
    <PlatformOwnerLayout>
      <Helmet><title>System Health — Platform Owner</title></Helmet>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity size={26} className="text-amber-400" />
            <div>
              <h1 className="text-2xl font-bold text-slate-100">System Health</h1>
              <p className="text-slate-400 text-sm">Platform diagnostics and database stats</p>
            </div>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-400 text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* DB Status Banner */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${metrics?.dbStatus === 'ok' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          {metrics?.dbStatus === 'ok'
            ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
            : <AlertCircle size={18} className="text-red-400 flex-shrink-0" />}
          <div>
            <p className={`text-sm font-semibold ${metrics?.dbStatus === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
              Database {metrics?.dbStatus === 'ok' ? 'Operational' : 'Error Detected'}
            </p>
            <p className="text-xs text-slate-500">Last checked: {lastRefresh.toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard label="Total Users" value={loading ? '—' : metrics?.totalUsers} icon={Users} status="ok" />
          <MetricCard label="Total Orders" value={loading ? '—' : metrics?.totalOrders} icon={Database} status="ok" />
          <MetricCard label="Activity Log Entries" value={loading ? '—' : metrics?.totalLogs} icon={Activity} status="ok" />
        </div>

        {/* Recent Activity Log */}
        <div className="bg-[#12121e] border border-amber-500/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Recent Activity Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : (metrics?.recentActivity || []).length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No activity logged</td></tr>
                ) : (metrics?.recentActivity || []).map((log, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-900/20">
                    <td className="px-6 py-3 text-slate-300">{log.action}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </motion.div>
    </PlatformOwnerLayout>
  );
};

export default PlatformSystemPage;
