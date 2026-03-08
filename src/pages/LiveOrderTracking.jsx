import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2, ArrowLeft, CheckCircle2, Clock, AlertCircle, Package,
  Truck, FileText, TrendingUp, Calendar, DollarSign, MapPin,
  FileCheck, Zap, BarChart3, Hourglass, ShieldCheck, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import OrderTimeline from '@/components/OrderTimeline';

const LiveOrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pipeline stages in order
  const STAGES = [
    { id: 'PENDING_ADMIN_SCRUB', label: 'Order Received', color: 'blue', icon: Package },
    { id: 'SANITIZED', label: 'Sanitizing', color: 'purple', icon: FileCheck },
    { id: 'AWARDED', label: 'Supplier Assigned', color: 'amber', icon: CheckCircle2 },
    { id: 'MATERIAL', label: 'Material Sourcing', color: 'sky', icon: Package },
    { id: 'CASTING', label: 'Casting', color: 'orange', icon: Zap },
    { id: 'MACHINING', label: 'Machining', color: 'violet', icon: Hourglass },
    { id: 'QC', label: 'Quality Control', color: 'emerald', icon: ShieldCheck },
    { id: 'DISPATCH', label: 'Dispatch', color: 'blue', icon: Truck },
    { id: 'DELIVERED', label: 'Delivered', color: 'green', icon: CheckCircle2 },
  ];

  useEffect(() => {
    if (!currentUser) return;
    fetchOrderData();

    // Set up realtime subscription for job_updates
    const channel = supabase
      .channel(`live-tracking-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_updates' },
        () => fetchOrderData()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        () => fetchOrderData()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [orderId, currentUser]);

  const fetchOrderData = async () => {
    if (!currentUser?.id) return;
    try {
      // Use maybeSingle to avoid PGRST116 error when RLS filters out the row
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) {
        setError('Order not found or you do not have permission to view it.');
        setLoading(false);
        return;
      }
      setOrder(orderData);

      // Fetch job updates only if the order has an rz_job_id
      if (orderData.rz_job_id) {
        const { data: updatesData, error: updatesError } = await supabase
          .from('job_updates')
          .select('*')
          .eq('rz_job_id', orderData.rz_job_id)
          .order('created_at', { ascending: true });

        if (updatesError) console.error('Failed to load updates:', updatesError);
        setUpdates(updatesData || []);
      } else {
        setUpdates([]);
      }
      setError(null);
    } catch (err) {
      console.error('LiveOrderTracking fetch error:', err);
      setError(err.message || 'Unable to load order data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <ClientDashboardLayout>
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-cyan-500 w-12 h-12" />
      </div>
    </ClientDashboardLayout>
  );

  if (error || !order) return (
    <ClientDashboardLayout>
      <div className="bg-red-950/30 border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-300 font-semibold mb-2">{error || 'Order not found'}</p>
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={() => { setLoading(true); setError(null); fetchOrderData(); }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors text-sm"
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/client-dashboard/orders')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors text-sm border border-slate-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    </ClientDashboardLayout>
  );

  // Map DB order_status values to pipeline stage IDs
  const STATUS_TO_STAGE_ID = {
    'PENDING_ADMIN_SCRUB': 'PENDING_ADMIN_SCRUB',
    'SANITIZED': 'SANITIZED',
  };
  const currentStageId = STATUS_TO_STAGE_ID[order.order_status] || order.order_status;
  const currentStageIndex = STAGES.findIndex(s => s.id === currentStageId);

  // Group updates by stage
  const updatesByStage = {};
  updates.forEach(update => {
    if (!updatesByStage[update.stage]) {
      updatesByStage[update.stage] = [];
    }
    updatesByStage[update.stage].push(update);
  });

  // Calculate days remaining
  const daysRequested = order.delivery_days || 60;
  const orderDate = new Date(order.created_at);
  const dueDate = new Date(orderDate.getTime() + daysRequested * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
  const isOnTrack = daysRemaining > 0;

  return (
    <ClientDashboardLayout>
      <Helmet><title>{`${order.ghost_public_name || 'Order'} - Order Tracking`}</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 text-sm font-bold">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-white font-mono tracking-tight mb-2">{order.ghost_public_name || order.part_name || 'Order'}</h1>
              <p className="text-slate-400 text-sm">RZ Job ID: <span className="text-cyan-400 font-mono">{order.rz_job_id || 'Pending'}</span></p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-sm border ${
              order.order_status === 'WITHDRAWN'
                ? 'bg-red-950/50 border-red-500 text-red-400'
                : isOnTrack 
                  ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400' 
                  : 'bg-red-950/50 border-red-500 text-red-400'
            }`}>
              {order.order_status === 'WITHDRAWN' 
                ? '✕ Withdrawn'
                : isOnTrack ? '✓ On Track' : '⚠ At Risk'
              }{order.order_status !== 'WITHDRAWN' && ` • ${Math.abs(daysRemaining)} days ${isOnTrack ? 'remaining' : 'overdue'}`}
            </div>
          </div>
        </div>

        {/* Order Details Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quantity */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Quantity</p>
              <Package className="text-blue-400" size={18} />
            </div>
            <p className="text-2xl font-black text-slate-100">{order.quantity ? order.quantity.toLocaleString() : '—'}</p>
            <p className="text-xs text-slate-400 mt-2">{order.material}</p>
          </div>

          {/* Unit Price */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Unit Price</p>
              <DollarSign className="text-emerald-400" size={18} />
            </div>
            <p className="text-2xl font-black text-slate-100">{order.unit_price ? `£${order.unit_price}` : '—'}</p>
            <p className="text-xs text-slate-400 mt-2">{order.quantity && order.unit_price ? `Total: £${(order.quantity * order.unit_price).toLocaleString()}` : 'Pending bid award'}</p>
          </div>

          {/* Delivery */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Delivery</p>
              <Calendar className="text-amber-400" size={18} />
            </div>
            <p className="text-2xl font-black text-slate-100">{daysRequested} days</p>
            <p className="text-xs text-slate-400 mt-2">{format(dueDate, 'MMM dd, yyyy')}</p>
          </div>

          {/* Delivery Location */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Location</p>
              <MapPin className="text-cyan-400" size={18} />
            </div>
            <p className="text-lg font-black text-slate-100">{order.delivery_to || 'To your door'}</p>
            <p className="text-xs text-slate-400 mt-2">Delivery method</p>
          </div>
        </div>

        {/* Pipeline Visualization */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <Zap size={24} className="text-cyan-400" />
            Manufacturing Pipeline
          </h2>

          <OrderTimeline
            currentStatus={order.order_status}
            createdAt={order.created_at}
            updatedAt={order.updated_at}
            updates={updates}
            isWithdrawn={order.order_status === 'WITHDRAWN'}
            selectedProcesses={order.manufacturing_processes}
          />
        </div>

        {/* Real-time Updates Feed */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <FileText size={24} className="text-blue-400" />
            Live Updates & Reports
          </h2>

          {updates.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Waiting for first supplier update...</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {updates.map((update, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-white">{update.stage?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-400 capitalize">{update.status?.replace(/_/g, ' ')}</p>
                    </div>
                    <p className="text-xs text-slate-500">{format(new Date(update.created_at), 'MMM dd, HH:mm')}</p>
                  </div>

                  {update.notes && (
                    <p className="text-sm text-slate-300 bg-slate-800/50 rounded p-3 mt-2">{update.notes}</p>
                  )}
                  {update.created_by && (
                    <p className="text-xs text-slate-500 mt-2">Updated by: {update.created_by}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quality & Compliance Reports */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-emerald-400" />
                QC Status
              </h3>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              order.is_qc_approved 
                ? 'bg-emerald-950/50 border border-emerald-500/50' 
                : 'bg-amber-950/50 border border-amber-500/50'
            }`}>
              <p className={`text-2xl font-black ${
                order.is_qc_approved ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {order.is_qc_approved ? '✓ APPROVED' : '⟳ PENDING'}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-950/30 to-slate-900 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FileCheck size={20} className="text-blue-400" />
                Documentation
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={16} className="text-cyan-400" />
                Order Specifications
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={16} className="text-cyan-400" />
                Quality Reports
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={16} className="text-cyan-400" />
                Shipping Documents
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default LiveOrderTracking;
