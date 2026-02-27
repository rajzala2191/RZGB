import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { useClientOrders } from '@/contexts/ClientContext';
import { Search, Filter, Calendar, ArrowRight, Package, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const ClientOrderHistoryPage = () => {
  const { orders, loading, error } = useClientOrders();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.rz_job_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-950/50 text-emerald-400 border-emerald-900';
      case 'dispatched': return 'bg-sky-950/50 text-sky-400 border-sky-900';
      case 'in_production': return 'bg-indigo-950/50 text-indigo-400 border-indigo-900';
      case 'po_issued': return 'bg-amber-950/50 text-amber-400 border-amber-900';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <ClientDashboardLayout>
      <Helmet><title>Order History - Client Portal</title></Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">My Orders</h1>
        <p className="text-slate-400">Track and manage your manufacturing orders.</p>
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by RZ-Job-ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 placeholder-slate-600"
            />
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter size={18} className="text-slate-500" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="po_issued">PO Issued</option>
              <option value="in_production">In Production</option>
              <option value="dispatched">Dispatched</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-lg min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-cyan-500" size={40} />
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-64 text-red-400">
              <AlertCircle size={40} className="mb-2" />
              <p>Failed to load orders.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-slate-500">
              <Package size={48} className="mb-4 opacity-50" />
              <p>No orders found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <th className="p-4">RZ-Job-ID</th>
                    <th className="p-4">Date Created</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/client-dashboard/orders/${order.id}`)}
                    >
                      <td className="p-4 font-mono text-cyan-400 font-bold">{order.rz_job_id || 'PENDING'}</td>
                      <td className="p-4 text-slate-400 flex items-center gap-2">
                        <Calendar size={14} />
                        {order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(order.status)}`}>
                          {(order.status || 'Unknown').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 w-48">
                         <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-cyan-500" 
                             style={{ 
                               width: order.status === 'completed' ? '100%' 
                                    : order.status === 'dispatched' ? '90%' 
                                    : order.status === 'in_production' ? '50%' : '10%' 
                             }} 
                           />
                         </div>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-slate-500 hover:text-cyan-400 transition-colors">
                          <ArrowRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientOrderHistoryPage;