import React from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { useClientOrders } from '@/contexts/ClientContext';
import { ArrowRight, Loader2, AlertCircle, Folder, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectsOverviewPage = () => {
  const { orders, loading, error } = useClientOrders();
  const navigate = useNavigate();

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center p-24 h-full">
          <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-20 h-20 mb-6 animate-pulse" />
          <Loader2 className="animate-spin text-cyan-500 w-10 h-10 mb-4" />
          <p className="text-slate-400 font-medium text-lg">RZ Global Solutions is loading your projects...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (error) {
    return (
      <ClientDashboardLayout>
        <div className="p-16 flex flex-col items-center text-red-400 gap-4 bg-[#0f172a] rounded-xl border border-slate-800 mt-8">
          <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 opacity-50 grayscale" />
          <div className="flex items-center gap-2 text-lg font-bold">
            <AlertCircle size={24} /> RZ Global Solutions Error
          </div>
          <p>Failed to load projects: {error}</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING_ADMIN_SCRUB': return 'bg-yellow-950 text-yellow-400 border-yellow-900';
      case 'SANITIZED': return 'bg-indigo-950 text-indigo-400 border-indigo-900';
      case 'OPEN_FOR_BIDDING': return 'bg-cyan-950 text-cyan-400 border-cyan-900';
      case 'AWARDED': return 'bg-amber-950 text-amber-400 border-amber-900';
      case 'MATERIAL':
      case 'CASTING':
      case 'MACHINING':
      case 'QC':
      case 'DISPATCH': return 'bg-blue-950 text-blue-400 border-blue-900';
      case 'DELIVERED': return 'bg-emerald-950 text-emerald-400 border-emerald-900';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <ClientDashboardLayout>
      <Helmet><title>My Projects - Client Portal</title></Helmet>
      
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-3">
            <Folder className="text-cyan-500" size={32} />
            Projects Overview
          </h1>
          <p className="text-slate-400">Track all your manufacturing orders and their progress.</p>
        </div>
        <button 
           onClick={() => navigate('/client-dashboard/create-order')}
           className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
           <Plus size={18} /> New Order
        </button>
      </div>

      <div className="bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1e293b] border-b border-slate-800 text-slate-300">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Part Name</th>
              <th className="p-4">Material</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-16 text-center text-slate-500">
                  <Folder size={48} className="text-slate-700 mx-auto mb-4" />
                  <p>No orders yet. Create one to get started.</p>
                </td>
              </tr>
            ) : orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 font-mono text-xs text-slate-500">{order.id.slice(0, 8)}</td>
                <td className="p-4 font-semibold text-slate-100">{order.part_name}</td>
                <td className="p-4 text-slate-300">{order.material}</td>
                <td className="p-4 text-slate-300">{order.quantity}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.order_status)}`}>
                    {order.order_status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <button
                    onClick={() => navigate(`/client-dashboard/projects/${order.id}/tracking`)}
                    className="text-cyan-400 hover:text-cyan-300 font-medium text-sm flex items-center gap-1"
                  >
                    Track <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ClientDashboardLayout>
  );
};

export default ProjectsOverviewPage;