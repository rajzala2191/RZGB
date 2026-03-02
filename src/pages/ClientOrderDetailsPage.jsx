
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import OrderTimeline from '@/components/OrderTimeline';
import { FileText, Download, ArrowRight, Loader2, ListTree, Trash2, XCircle, ArrowLeft } from 'lucide-react';

const WITHDRAWABLE = ['PENDING_ADMIN_SCRUB', 'SANITIZED', 'OPEN_FOR_BIDDING', 'BID_RECEIVED', 'AWARDED'];

export default function ClientOrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrder();
  }, [orderId, currentUser]);

  const fetchOrder = async () => {
    try {
      // Use maybeSingle to avoid PGRST116 error when RLS filters out the row
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
      if (error) throw error;
      if (!data) {
        toast({ title: 'Not Found', description: 'Order not found or you do not have permission to view it.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      setOrder(data);

      // Fetch job updates for timeline
      if (data?.rz_job_id) {
        const { data: upd } = await supabase.from('job_updates')
          .select('*')
          .eq('rz_job_id', data.rz_job_id)
          .order('created_at', { ascending: true });
        if (upd) setUpdates(upd);
      }
    } catch (err) {
      console.error('ClientOrderDetailsPage fetch error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to load order details.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const { error: err } = await supabase.from('orders').update({
        order_status: 'WITHDRAWN',
        updated_at: new Date().toISOString()
      }).eq('id', orderId);
      if (err) throw err;
      toast({ title: 'Order Withdrawn', description: 'Your order has been successfully withdrawn.' });
      setOrder(prev => ({ ...prev, order_status: 'WITHDRAWN' }));
      setConfirmWithdraw(false);
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to withdraw.', variant: 'destructive' });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <ClientDashboardLayout><div className="flex justify-center p-24"><Loader2 className="animate-spin text-cyan-500 w-10 h-10" /></div></ClientDashboardLayout>;
  if (!order) return <ClientDashboardLayout><div className="p-8 text-slate-400">Order not found.</div></ClientDashboardLayout>;

  const currentStatus = order.order_status || order.status || 'PENDING_ADMIN_SCRUB';

  return (
    <ClientDashboardLayout>
      <div className="max-w-6xl mx-auto py-8 space-y-8">
        
        {/* Back Button */}
        <button onClick={() => navigate('/client-dashboard/orders')} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold">
          <ArrowLeft size={16} /> Back to Orders
        </button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl">
          <div>
            <h1 className="text-3xl font-black text-slate-100">{order.part_name || 'Unnamed Order'}</h1>
            <p className="text-slate-400 mt-1 font-mono">Order ID: {order.id.slice(0, 8)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider border ${
              currentStatus === 'WITHDRAWN' 
                ? 'bg-red-950/50 border-red-800 text-red-400' 
                : 'bg-cyan-950/50 border-cyan-800 text-cyan-400'
            }`}>
              {currentStatus.replace(/_/g, ' ')}
            </span>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/client-dashboard/orders/${order.id}/tracking`)} className="bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold border border-slate-700">
                 <ListTree className="w-4 h-4 mr-2" /> View Workflow Tracking
              </Button>
              {WITHDRAWABLE.includes(currentStatus) && (
                confirmWithdraw ? (
                  <div className="flex gap-2">
                    <Button onClick={handleWithdraw} disabled={withdrawing} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                      {withdrawing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                      Confirm Withdraw
                    </Button>
                    <Button onClick={() => setConfirmWithdraw(false)} variant="outline" className="border-slate-700 text-slate-400">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setConfirmWithdraw(true)} variant="outline" className="border-red-800/50 text-red-400 hover:bg-red-950/50 hover:text-red-300">
                    <Trash2 className="w-4 h-4 mr-2" /> Withdraw
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#0f172a] p-6 rounded-xl shadow-xl border border-slate-800">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3 mb-6 text-slate-100">Order Specifications</h2>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Material</p>
                  <p className="text-slate-200 font-medium">{order.material || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Quantity</p>
                  <p className="text-slate-200 font-medium">{order.quantity || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Tolerance</p>
                  <p className="text-slate-200 font-medium">{order.tolerance || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Surface Finish</p>
                  <p className="text-slate-200 font-medium">{order.surface_finish || 'As Machined'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Description</p>
                  <p className="text-slate-300 bg-[#1e293b] p-3 rounded-lg border border-slate-700 mt-1 min-h-[60px]">{order.description || 'No description provided.'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Special Requirements</p>
                  <p className="text-slate-300 bg-[#1e293b] p-3 rounded-lg border border-slate-700 mt-1 min-h-[60px]">{order.special_requirements || 'None specified.'}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl shadow-xl border border-slate-800">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3 mb-6 text-slate-100">Documents & Files</h2>
              <div className="space-y-3">
                 {/* Placeholder for actual files fetch. In real app, query documents table */}
                 <div className="flex items-center justify-between p-4 border border-slate-700 bg-[#1e293b] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-cyan-500" />
                      <div>
                        <p className="text-slate-200 font-medium">Initial_Design_Specs.pdf</p>
                        <p className="text-xs text-slate-500">Uploaded {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800"><Download className="w-5 h-5" /></Button>
                 </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions / Progress */}
          <div className="space-y-8">
            <div className="bg-[#0f172a] p-6 rounded-xl shadow-xl border border-slate-800">
              <h2 className="text-lg font-bold border-b border-slate-800 pb-3 mb-6 text-slate-100">Action Required</h2>
              {currentStatus === 'DRAFT' ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">Your order is in draft state. Submit it for engineering review when ready.</p>
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold">Submit for Review</Button>
                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <Loader2 className="w-12 h-12 text-cyan-500 mx-auto animate-spin mb-4" />
                  <p className="text-sm text-slate-300 font-medium">Order is currently locked for processing.</p>
                  <p className="text-xs text-slate-500">Awaiting status change from our engineering team.</p>
                </div>
              )}
            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl shadow-xl border border-slate-800">
               <h2 className="text-lg font-bold border-b border-slate-800 pb-3 mb-6 text-slate-100">Order Timeline</h2>
               <OrderTimeline 
                 currentStatus={currentStatus} 
                 createdAt={order.created_at} 
                 updatedAt={order.updated_at} 
                 updates={updates}
               />
            </div>
          </div>

        </div>
      </div>
    </ClientDashboardLayout>
  );
}
