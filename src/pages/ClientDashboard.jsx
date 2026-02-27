import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useClientOrders, useClientDocuments } from '@/contexts/ClientContext';
import { Briefcase, LogOut, Loader2, X, FileText, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JourneyStepper from '@/components/JourneyStepper';
import QualityVault from '@/components/QualityVault';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const ClientDashboard = () => {
  const { currentUser, userCompanyName, logout } = useAuth();
  const { orders, loading: ordersLoading } = useClientOrders();
  const { documents, loading: docsLoading } = useClientDocuments();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const loading = ordersLoading || docsLoading;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans">
      <Helmet>
        <title>Client Dashboard - Ghost Portal</title>
      </Helmet>

      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Briefcase className="text-sky-500 h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold tracking-wide">CLIENT PORTAL</h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{userCompanyName || 'Valued Client'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-950/30 text-red-500 border border-red-900 hover:bg-red-900/50 px-4 py-2 rounded-lg text-sm font-bold transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-sky-500 w-10 h-10" />
          </div>
        ) : (
          <>
            {/* Orders Section */}
            <div>
               <h2 className="text-2xl font-bold text-slate-100 mb-4">Active Orders</h2>
               <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                        <th className="p-4">RZ-Order-ID</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Current Stage</th>
                        <th className="p-4">Created Date</th>
                        <th className="p-4">Expected Delivery</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {orders.map(order => (
                        <tr 
                          key={order.id} 
                          onClick={() => setSelectedOrder(order)}
                          className="hover:bg-slate-900/50 cursor-pointer transition-colors"
                        >
                           <td className="p-4 font-mono font-medium text-sky-400">{order.rz_id}</td>
                           <td className="p-4">
                             <span className="px-2 py-1 rounded-full text-xs font-bold uppercase bg-slate-900 text-slate-300 border border-slate-700">
                               {order.status}
                             </span>
                           </td>
                           <td className="p-4 text-slate-300">
                              {/* Mapping status to readable stage */}
                              {order.status === 'active' ? 'Material Sourced' : 
                               order.status === 'processing' ? 'In Production' : 'Processing'}
                           </td>
                           <td className="p-4 text-slate-400">{format(new Date(order.created_at), 'MMM dd, yyyy')}</td>
                           <td className="p-4 text-slate-400">
                              {/* Mock delivery date */}
                              {format(new Date(new Date(order.created_at).setDate(new Date(order.created_at).getDate() + 14)), 'MMM dd, yyyy')}
                           </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan="5" className="p-8 text-center text-slate-500">No active orders found.</td></tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>

            {/* Quality Vault */}
            <QualityVault documents={documents} />
          </>
        )}
      </main>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
             onClick={() => setSelectedOrder(null)}
          >
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               onClick={(e) => e.stopPropagation()}
               className="bg-[#0f172a] border border-slate-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl"
             >
                <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                   <div>
                      <h2 className="text-2xl font-bold text-white font-mono">{selectedOrder.rz_id}</h2>
                      <p className="text-slate-400 text-sm mt-1">Order Details & Timeline</p>
                   </div>
                   <button onClick={() => setSelectedOrder(null)} className="text-slate-500 hover:text-white transition-colors">
                      <X size={24} />
                   </button>
                </div>
                
                <div className="p-8 bg-[#020617]">
                   <JourneyStepper currentStage={selectedOrder.status} />
                </div>
                
                <div className="p-6 bg-[#0f172a] grid grid-cols-2 gap-6">
                   <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Timeline</h4>
                      <div className="space-y-3">
                         <div className="flex items-center gap-3 text-sm">
                            <Calendar size={16} className="text-sky-500" />
                            <span className="text-slate-300">Ordered: {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy')}</span>
                         </div>
                         <div className="flex items-center gap-3 text-sm">
                            <Clock size={16} className="text-emerald-500" />
                            <span className="text-slate-300">Est. Delivery: {format(new Date(new Date(selectedOrder.created_at).setDate(new Date(selectedOrder.created_at).getDate() + 14)), 'MMM dd, yyyy')}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Documentation</h4>
                       {/* Check if there's a matching doc in the documents list */}
                       {documents.find(d => d.rz_id === selectedOrder.rz_id || true /* Mock true for layout */) ? (
                          <button className="w-full bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                             <FileText size={16} /> Download Certificate
                          </button>
                       ) : (
                          <p className="text-sm text-slate-500 italic">No certified documents available yet.</p>
                       )}
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;