
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import OrderTimeline from '@/components/OrderTimeline';
import DocumentPreview, { DocumentPreviewModal } from '@/components/DocumentPreview';
import { FileText, Download, ArrowRight, Loader2, ListTree, Trash2, XCircle, ArrowLeft, Eye, FileImage, ClipboardList, PoundSterling, MapPin } from 'lucide-react';
import { FormSection, DisplayField } from '@/components/ui/FormSection';

const WITHDRAWABLE = ['PENDING_ADMIN_SCRUB', 'SANITIZED', 'OPEN_FOR_BIDDING', 'BID_RECEIVED', 'AWARDED'];

export default function ClientOrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

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

      // Fetch documents for this order (use admin client to bypass RLS if needed)
      const { data: docs } = await supabaseAdmin.from('documents')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      if (docs) setDocuments(docs);
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

  if (loading) return <ClientDashboardLayout><div className="flex justify-center p-24"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div></ClientDashboardLayout>;
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
                : 'bg-orange-950/50 border-orange-800 text-orange-400'
            }`}>
              {currentStatus.replace(/_/g, ' ')}
            </span>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/client-dashboard/orders/${order.id}/tracking`)} className="bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold border border-slate-700">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
            <FormSection title="Order Specifications" icon={ClipboardList}>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <DisplayField label="Material"       value={order.material       || 'Not specified'} />
                <DisplayField label="Quantity"       value={order.quantity       || 'Not specified'} />
                <DisplayField label="Tolerance"      value={order.tolerance      || 'Standard'} />
                <DisplayField label="Surface Finish" value={order.surface_finish || 'As Machined'} />
                {order.buy_price && (
                  <DisplayField label="Price per Part">
                    <p className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                      <PoundSterling size={13} />
                      {parseFloat(order.buy_price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </p>
                  </DisplayField>
                )}
                {order.delivery_location && (
                  <DisplayField label="Delivery Location">
                    <p className="text-slate-200 text-sm flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-500" />
                      {order.delivery_location}
                    </p>
                  </DisplayField>
                )}
                <div className="col-span-2">
                  <DisplayField label="Description">
                    <p className="text-slate-300 bg-[#1e293b] p-3 rounded-lg border border-slate-700 mt-1 min-h-[60px] text-sm">{order.description || 'No description provided.'}</p>
                  </DisplayField>
                </div>
                <div className="col-span-2">
                  <DisplayField label="Special Requirements">
                    <p className="text-slate-300 bg-[#1e293b] p-3 rounded-lg border border-slate-700 mt-1 min-h-[60px] text-sm">{order.special_requirements || 'None specified.'}</p>
                  </DisplayField>
                </div>
              </div>
            </FormSection>

            <FormSection title="Documents & Files" icon={Eye}>
              <div className="space-y-3">
                 {documents.length === 0 ? (
                   <div className="text-center py-8 text-slate-500">
                     <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                     <p>No documents uploaded yet.</p>
                   </div>
                 ) : (
                   documents.map(doc => (
                     <DocumentPreview
                       key={doc.id}
                       filePath={doc.file_path}
                       fileName={doc.file_name}
                       fileUrl={doc.file_url}
                       compact={true}
                     />
                   ))
                 )}
              </div>
            </FormSection>
          </div>

          {/* Sidebar Actions / Progress */}
          <div className="space-y-6">
            <FormSection title="Status">
              {currentStatus === 'DRAFT' ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">Your order is in draft. Submit it for engineering review when ready.</p>
                  <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold">Submit for Review</Button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <Loader2 className="w-10 h-10 text-orange-500 mx-auto animate-spin" />
                  <p className="text-sm text-slate-300 font-medium">Order is locked for processing.</p>
                  <p className="text-xs text-slate-500">Awaiting update from our engineering team.</p>
                </div>
              )}
            </FormSection>

            <FormSection title="Order Timeline">
              <OrderTimeline
                currentStatus={currentStatus}
                createdAt={order.created_at}
                updatedAt={order.updated_at}
                updates={updates}
              />
            </FormSection>
          </div>

        </div>
      </div>
    </ClientDashboardLayout>
  );
}
