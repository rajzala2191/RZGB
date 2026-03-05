import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { useClientOrders } from '@/contexts/ClientContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Loader2, AlertCircle, Folder, Plus, Trash2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OrderTimeline from '@/components/OrderTimeline';

const WITHDRAWABLE = ['PENDING_ADMIN_SCRUB', 'SANITIZED', 'OPEN_FOR_BIDDING', 'BID_RECEIVED', 'AWARDED'];

const OrdersOverviewPage = () => {
  const { orders, loading, error, refreshOrders } = useClientOrders();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [clearingWithdrawn, setClearingWithdrawn] = useState(false);

  const handleWithdraw = async (orderId) => {
    setWithdrawingId(orderId);
    try {
      const { error: err } = await supabase.from('orders').update({
        order_status: 'WITHDRAWN',
        updated_at: new Date().toISOString()
      }).eq('id', orderId);
      if (err) throw err;
      toast({ title: 'Order Withdrawn', description: 'Your order has been successfully withdrawn.' });
      if (refreshOrders) refreshOrders();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to withdraw order.', variant: 'destructive' });
    } finally {
      setWithdrawingId(null);
      setConfirmId(null);
    }
  };

  const handleClearWithdrawn = async () => {
    setClearingWithdrawn(true);
    try {
      const withdrawnOrders = orders.filter(o => o.order_status === 'WITHDRAWN');
      if (withdrawnOrders.length === 0) {
        toast({ title: 'No Withdrawn Orders', description: 'There are no withdrawn orders to clear.' });
        setClearingWithdrawn(false);
        return;
      }

      // Update each withdrawn order individually to avoid RLS/batch issues
      let cleared = 0;
      for (const wo of withdrawnOrders) {
        const { error: err } = await supabase
          .from('orders')
          .update({ order_status: 'CLEARED', updated_at: new Date().toISOString() })
          .eq('id', wo.id);
        if (err) {
          console.error(`Failed to clear order ${wo.id}:`, err);
        } else {
          cleared++;
        }
      }

      if (cleared > 0) {
        toast({ title: 'Cleared', description: `${cleared} withdrawn order(s) cleared.` });
        if (refreshOrders) refreshOrders();
      } else {
        toast({ title: 'Error', description: 'Could not clear withdrawn orders. Check console for details.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Clear withdrawn error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to clear withdrawn orders.', variant: 'destructive' });
    } finally {
      setClearingWithdrawn(false);
    }
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center p-24 h-full">
          <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-20 h-20 mb-6 animate-pulse" />
          <Loader2 className="animate-spin text-cyan-500 w-10 h-10 mb-4" />
          <p className="text-slate-400 font-medium text-lg">RZ Global Solutions is loading your orders...</p>
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
          <p>Failed to load orders: {error}</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING_ADMIN_SCRUB': return 'bg-yellow-950 text-yellow-400 border-yellow-900';
      case 'SANITIZED': return 'bg-indigo-950 text-indigo-400 border-indigo-900';
      case 'OPEN_FOR_BIDDING':
      case 'BID_RECEIVED': return 'bg-cyan-950 text-cyan-400 border-cyan-900';
      case 'AWARDED': return 'bg-amber-950 text-amber-400 border-amber-900';
      case 'MATERIAL':
      case 'CASTING':
      case 'MACHINING':
      case 'QC':
      case 'DISPATCH': return 'bg-blue-950 text-blue-400 border-blue-900';
      case 'DELIVERED': return 'bg-emerald-950 text-emerald-400 border-emerald-900';
      case 'WITHDRAWN': return 'bg-red-950 text-red-400 border-red-900';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <ClientDashboardLayout>
      <Helmet><title>My Orders - Client Portal</title></Helmet>
      
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-3">
            <Folder className="text-cyan-500" size={32} />
            Orders Overview
          </h1>
          <p className="text-slate-400">Track all your manufacturing orders and their progress.</p>
        </div>
        <div className="flex items-center gap-3">
          {orders.some(o => o.order_status === 'WITHDRAWN') && (
            <button
              onClick={handleClearWithdrawn}
              disabled={clearingWithdrawn}
              className="flex items-center gap-2 bg-red-950/50 hover:bg-red-900/50 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg font-medium transition-colors border border-red-800/50 text-sm"
            >
              {clearingWithdrawn ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Clear Withdrawn
            </button>
          )}
          <button 
             onClick={() => navigate('/client-dashboard/create-order')}
             className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
             <Plus size={18} /> New Order
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-xl border border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1e293b] border-b border-slate-800 text-slate-300">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Part Name</th>
              <th className="p-4">Material</th>
              <th className="p-4">Qty</th>
              <th className="p-4">Status</th>
              <th className="p-4">Progress</th>
              <th className="p-4">Created</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-16 text-center text-slate-500">
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
                <td className="p-4 w-40">
                  <OrderTimeline currentStatus={order.order_status} compact />
                </td>
                <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/client-dashboard/orders/${order.id}/tracking`)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium text-sm flex items-center gap-1"
                    >
                      Track <ArrowRight size={14} />
                    </button>
                    {WITHDRAWABLE.includes(order.order_status) && (
                      confirmId === order.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleWithdraw(order.id)}
                            disabled={withdrawingId === order.id}
                            className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 bg-red-950/50 border border-red-800/50 rounded"
                          >
                            {withdrawingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                          </button>
                          <button onClick={() => setConfirmId(null)} className="text-slate-400 hover:text-slate-300 text-xs px-1">
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmId(order.id); }}
                          className="text-red-500/60 hover:text-red-400 transition-colors"
                          title="Withdraw Order"
                        >
                          <Trash2 size={14} />
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ClientDashboardLayout>
  );
};

export default OrdersOverviewPage;