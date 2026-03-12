import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PlatformAdminLayout from '@/components/PlatformAdminLayout';
import { fetchAllWorkspaces, fetchAllPlatformStats } from '@/services/workspaceService';
import { Building2, Users, ShoppingCart, Activity, Loader2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}><Icon size={16} /></div>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{value}</p>
    </motion.div>
  );
}

export default function PlatformDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [statsRes, wsRes] = await Promise.all([fetchAllPlatformStats(), fetchAllWorkspaces()]);
    setStats(statsRes);
    if (wsRes.data) setWorkspaces(wsRes.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-red-500" size={32} /></div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Platform Overview</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Platform Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Cross-tenant metrics and workspace health.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Workspaces" value={stats.workspaces} icon={Building2} color="bg-blue-100 dark:bg-blue-950/30 text-blue-600" />
          <StatCard title="Total Users" value={stats.users} icon={Users} color="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600" />
          <StatCard title="Total Orders" value={stats.orders} icon={ShoppingCart} color="bg-orange-100 dark:bg-orange-950/30 text-orange-600" />
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-3">Recent Workspaces</h2>
          <div className="space-y-2">
            {workspaces.slice(0, 10).map(ws => (
              <div key={ws.id}
                onClick={() => navigate(`/platform-admin/workspaces`)}
                className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 flex items-center gap-4 hover:border-red-300 dark:hover:border-red-800 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{ws.name}</p>
                  <p className="text-xs text-gray-400">{ws.slug} | {ws.status} | {format(new Date(ws.created_at), 'dd MMM yyyy')}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  ws.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-600' :
                  ws.status === 'suspended' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-600' :
                  'bg-gray-100 dark:bg-gray-800 border-gray-300 text-gray-500'
                }`}>{ws.status.toUpperCase()}</span>
                <ChevronRight size={14} className="text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PlatformAdminLayout>
  );
}
