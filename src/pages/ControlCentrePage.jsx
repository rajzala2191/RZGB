import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, Shield, Briefcase, Truck, ArrowUpRight, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import SystemStatus from '@/components/SystemStatus';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/AdminContext';
import { formatDistanceToNow } from 'date-fns';

const ControlCentrePage = () => {
  const navigate = useNavigate();
  const { pendingOrdersCount, orders } = useOrders();
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    clients: 0,
    suppliers: 0
  });
  const [loading, setLoading] = useState(true);

  const pendingOrdersList = orders.filter(o => o.order_status === 'PENDING_ADMIN_SCRUB').slice(0, 5);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role');

        if (error) throw error;

        const total = data.length;
        const admins = data.filter(p => p.role === 'admin').length;
        const clients = data.filter(p => p.role === 'client').length;
        const suppliers = data.filter(p => p.role === 'supplier').length;

        setStats({ total, admins, clients, suppliers });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const Card = ({ title, value, icon: Icon, color }) => (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-lg hover:border-sky-500/30 transition-all group">
      <div className="flex justify-between items-start">
        <div>
           <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
           <h3 className="text-3xl font-bold text-slate-100 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-slate-900 ${color} group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
         <ArrowUpRight size={14} className="text-emerald-500" />
         <span className="text-emerald-500 font-medium">Live</span> Real-time data
      </div>
    </div>
  );

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>Dashboard - RZ Global Solutions Ghost Portal</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-100">Command Centre</h1>
          <p className="text-slate-400">
            System Overview & Operational Status for <span className="text-sky-500 font-semibold">Ghost Portal</span>.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card title="Total Users" value={stats.total} icon={Users} color="text-indigo-400" />
          <Card title="Clients" value={stats.clients} icon={Briefcase} color="text-sky-400" />
          <Card title="Suppliers" value={stats.suppliers} icon={Truck} color="text-amber-400" />
          <Card title="Admins" value={stats.admins} icon={Shield} color="text-emerald-400" />
          <div className="bg-yellow-950/30 border border-yellow-900/50 rounded-xl p-6 shadow-lg hover:border-yellow-500/50 transition-all cursor-pointer group" onClick={() => navigate('/control-centre/sanitisation-gate')}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-yellow-500/70 text-sm font-medium uppercase tracking-wider">Pending Orders</p>
                <h3 className="text-3xl font-bold text-yellow-500 mt-2">{pendingOrdersCount}</h3>
              </div>
              <div className="p-3 rounded-lg bg-yellow-900/30 text-yellow-500 group-hover:scale-110 transition-transform">
                <AlertCircle size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-yellow-600/70">
              <span className="font-medium">Action Required</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-6 min-h-[300px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-100">New Orders (Pending Scrub)</h3>
                <button onClick={() => navigate('/control-centre/sanitisation-gate')} className="text-sm text-sky-400 hover:text-sky-300">View All</button>
              </div>
              
              <div className="flex-1">
                {pendingOrdersList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <CheckCircle size={40} className="mb-4 text-slate-700" />
                    <p>All clear. No pending orders to review.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingOrdersList.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                        <div>
                          <h4 className="text-white font-medium">{order.part_name || order.id.slice(0, 8)}</h4>
                          <p className="text-sm text-slate-400">Client: {order.client?.company_name || order.client?.email || 'Unknown'}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock size={14} />
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                          </span>
                          <button 
                            onClick={() => navigate(`/control-centre/sanitisation-gate/review/${order.id}`)}
                            className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded hover:bg-sky-500/20 transition-colors"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
           </div>
           
           <div className="lg:col-span-1 bg-[#0f172a] border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Operational Status</h3>
              <SystemStatus />
           </div>
        </div>
      </motion.div>
    </ControlCentreLayout>
  );
};

export default ControlCentrePage;