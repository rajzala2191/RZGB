
import React from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClientOrders } from '@/contexts/ClientContext';
import { Package, CheckCircle, Clock, ArrowRight, TrendingUp, AlertCircle, FileText, PlusCircle, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ClientDashboardPage = () => {
  const { userCompanyName } = useAuth();
  const { orders, loading, error } = useClientOrders();
  const navigate = useNavigate();

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center p-24 h-full">
          <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-20 h-20 mb-6 animate-pulse" />
          <p className="text-slate-400 font-medium text-lg">RZ Global Solutions is loading your dashboard...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (error) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center p-24 h-full">
          <div className="bg-[#0f172a] border border-red-500/30 rounded-xl p-8 max-w-md w-full text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-100 mb-2">Unable to Load Dashboard</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.order_status !== 'COMPLETED').length;
  const completedOrders = orders.filter(o => o.status === 'completed' || o.order_status === 'COMPLETED').length;
  const pendingReview = orders.filter(o => o.order_status === 'PENDING_ADMIN_SCRUB').length;
  const totalOrders = orders.length;

  const recentOrders = orders.slice(0, 5);

  return (
    <ClientDashboardLayout>
      <Helmet><title>Dashboard - Client Portal</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-100 mb-2 tracking-tight">
            Welcome back, <span className="text-cyan-400">{userCompanyName || 'Partner'}</span>
          </h1>
          <p className="text-slate-400 text-lg">Manage and track your manufacturing orders.</p>
        </div>
        <button 
           onClick={() => navigate('/client-dashboard/create-order')}
           className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/40 hover:scale-105"
        >
           <PlusCircle size={20} /> Create New Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard title="Total Orders" value={totalOrders} icon={LayoutDashboard} color="blue" />
        <MetricCard title="In Progress" value={activeOrders} icon={TrendingUp} color="cyan" />
        <MetricCard title="Completed" value={completedOrders} icon={CheckCircle} color="emerald" />
        <MetricCard title="Pending Review" value={pendingReview} icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Recent Orders List */}
        <div className="xl:col-span-2 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Package className="text-cyan-500" size={24} /> Recent Orders
            </h2>
            <button 
              onClick={() => navigate('/client-dashboard/orders')}
              className="text-sm font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-[#1e293b] rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-500">
                        <FileText size={20} />
                     </div>
                     <div>
                       <h4 className="text-slate-200 font-bold group-hover:text-cyan-400 transition-colors">{order.part_name || 'Unnamed Order'}</h4>
                       <p className="text-xs text-slate-500 mt-1 font-mono">ID: {order.id.slice(0, 8)} | {new Date(order.created_at).toLocaleDateString()}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-700">
                       {(order.order_status || order.status || 'Draft').replace(/_/g, ' ')}
                     </span>
                     <button onClick={() => navigate(`/client-dashboard/orders/${order.id}/tracking`)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <ArrowRight size={18} />
                     </button>
                   </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-12 italic">No recent orders found.</div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
            <ActivityIcon /> Activity Feed
          </h2>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
             {recentOrders.slice(0, 4).map((order, i) => (
               <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-700 bg-slate-900 text-cyan-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-700 bg-[#1e293b] shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-slate-200 text-sm">Status Update</div>
                      <time className="text-xs font-mono text-slate-500">{new Date(order.updated_at).toLocaleDateString()}</time>
                    </div>
                    <div className="text-xs text-slate-400">Order <span className="text-cyan-400">{order.part_name || order.id.slice(0,6)}</span> moved to {order.order_status?.replace(/_/g, ' ') || 'Pending'}</div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

const ActivityIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="text-cyan-500"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

const MetricCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    cyan: "text-cyan-500 bg-cyan-950/20 border-cyan-900/50 group-hover:border-cyan-500/50",
    emerald: "text-emerald-500 bg-emerald-950/20 border-emerald-900/50 group-hover:border-emerald-500/50",
    amber: "text-amber-500 bg-amber-950/20 border-amber-900/50 group-hover:border-amber-500/50",
    blue: "text-blue-500 bg-blue-950/20 border-blue-900/50 group-hover:border-blue-500/50",
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`bg-[#0f172a] border border-slate-800 rounded-xl p-6 transition-all group relative overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colors[color].split(' ')[0]}`}>
        <Icon size={80} />
      </div>
      <div className="flex justify-between items-start relative z-10">
        <div>
           <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</p>
           <h3 className="text-4xl font-black text-white mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${colors[color]}`}>
           <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
};

export default ClientDashboardPage;
