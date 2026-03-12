import React, { useEffect, useState, useCallback, useMemo } from 'react';
import OrderMessageThread from '@/components/OrderMessageThread';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Loader2, AlertCircle, CheckCircle2, ChevronRight,
  Package, Zap, Hourglass, ShieldCheck, Truck, AlertTriangle,
  Eye, ArrowUpDown, Filter, Search, MessageSquare, ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';

const ACCENT = '#FF6B35';

function buildPipeline(selectedProcesses) {
  const mid = selectedProcesses?.length > 0 ? selectedProcesses : ['MATERIAL', 'MACHINING'];
  return ['AWARDED', ...mid, 'QC', 'DISPATCH', 'DELIVERED'];
}

const STAGES = [
  { id: 'AWARDED',   label: 'Assigned',       icon: CheckCircle2, hex: '#f59e0b' },
  { id: 'MATERIAL',  label: 'Material',        icon: Package,      hex: '#0ea5e9' },
  { id: 'CASTING',   label: 'Casting',         icon: Zap,          hex: '#f97316' },
  { id: 'MACHINING', label: 'Machining',       icon: Hourglass,    hex: '#8b5cf6' },
  { id: 'QC',        label: 'Quality Control', icon: ShieldCheck,  hex: '#22c55e' },
  { id: 'DISPATCH',  label: 'Dispatch',        icon: Truck,        hex: '#06b6d4' },
  { id: 'DELIVERED', label: 'Delivered',       icon: CheckCircle2, hex: '#16a34a' },
];

// Inline dot-progress strip
function StageProgress({ pipeline, currentStatus, isDark }) {
  const currentIdx = pipeline.indexOf(currentStatus);
  const inactive = isDark ? '#3f3f46' : '#e2e8f0';
  return (
    <div className="flex items-center gap-1">
      {pipeline.map((id, i) => {
        const done    = i < currentIdx;
        const current = i === currentIdx;
        const stageHex = STAGES.find(s => s.id === id)?.hex || '#94a3b8';
        return (
          <React.Fragment key={id}>
            <div
              className="rounded-full transition-all duration-300"
              style={{
                width:  current ? 8 : 6,
                height: current ? 8 : 6,
                background: done ? '#22c55e' : current ? stageHex : inactive,
                boxShadow: current ? `0 0 0 2px ${stageHex}30` : 'none',
              }}
            />
            {i < pipeline.length - 1 && (
              <div className="h-px flex-1 min-w-[6px]" style={{ background: i < currentIdx ? '#22c55e40' : inactive }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function SupplierOrderManager() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [error, setError]                 = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, orderId: null, newStatus: null, orderName: '', fromStage: '', toStage: '', note: '' });
  const [expandedMessages, setExpandedMessages] = useState(new Set());

  // Filter / sort state
  const [search, setSearch]           = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sortBy, setSortBy]           = useState('date_desc');

  const fetchAwardedOrders = useCallback(async (clearErrors = true) => {
    try {
      if (!currentUser?.id) { setError('User not authenticated.'); setLoading(false); return; }
      const { data, error: err } = await supabase
        .from('orders')
        .select('id, rz_job_id, part_name, material, order_status, client_id, created_at, updated_at, ghost_public_name, quantity, selected_processes')
        .eq('supplier_id', currentUser.id)
        .in('order_status', ['AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH', 'DELIVERED'])
        .order('created_at', { ascending: false });
      if (err) throw err;
      setOrders(data || []);
      if (clearErrors) setError(null);
    } catch (err) {
      setError(`Failed to load orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchAwardedOrders();
    const channel = supabase
      .channel('supplier-order-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAwardedOrders())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [currentUser, fetchAwardedOrders]);

  const confirmStageChange = (orderId, newStatus) => {
    const order = orders.find(p => p.id === orderId);
    const currentStage = STAGES.find(s => s.id === order?.order_status);
    const nextStage    = STAGES.find(s => s.id === newStatus);
    setConfirmDialog({
      open: true, orderId, newStatus,
      orderName: order?.part_name || order?.id?.slice(0, 8) || 'Order',
      fromStage: currentStage?.label || order?.order_status,
      toStage:   nextStage?.label || newStatus,
      note: '',
    });
  };

  const updateOrderStatus = async (orderId, newStatus, supplierNote = '') => {
    setConfirmDialog({ open: false, orderId: null, newStatus: null, orderName: '', fromStage: '', toStage: '', note: '' });
    setUpdatingOrder(orderId);
    setError(null);
    const order = orders.find(p => p.id === orderId);
    const stageName = STAGES.find(s => s.id === newStatus)?.label || newStatus;
    try {
      const { error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({ order_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('supplier_id', currentUser.id);
      if (updateErr) throw new Error(updateErr.message);

      if (order?.rz_job_id) {
        await supabaseAdmin.from('job_updates').insert({
          rz_job_id: order.rz_job_id,
          stage: newStatus,
          status: 'in_progress',
          notes: supplierNote?.trim() || `Stage advanced to ${stageName}`,
          created_by: currentUser?.email,
        });
      }

      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, order_status: newStatus, updated_at: new Date().toISOString() } : o
      ));
      setSuccessMessage(`Order moved to ${stageName}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(`Failed to update: ${err.message}`);
      fetchAwardedOrders(false);
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Derived: filter + sort
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.part_name?.toLowerCase().includes(q) ||
        o.rz_job_id?.toLowerCase().includes(q) ||
        o.material?.toLowerCase().includes(q)
      );
    }

    // Stage filter
    if (stageFilter !== 'all') {
      if (stageFilter === 'active') {
        list = list.filter(o => o.order_status !== 'DELIVERED');
      } else if (stageFilter === 'delivered') {
        list = list.filter(o => o.order_status === 'DELIVERED');
      } else {
        list = list.filter(o => o.order_status === stageFilter);
      }
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'date_asc')  return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'stage') {
        const stageOrder = ['AWARDED','MATERIAL','CASTING','MACHINING','QC','DISPATCH','DELIVERED'];
        return stageOrder.indexOf(a.order_status) - stageOrder.indexOf(b.order_status);
      }
      if (sortBy === 'name') return (a.part_name || '').localeCompare(b.part_name || '');
      return 0;
    });

    return list;
  }, [orders, search, stageFilter, sortBy]);

  const activeCount    = orders.filter(o => o.order_status !== 'DELIVERED').length;
  const deliveredCount = orders.filter(o => o.order_status === 'DELIVERED').length;

  if (loading) return (
    <SupplierHubLayout>
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
        <p className="text-sm text-slate-400">Loading orders…</p>
      </div>
    </SupplierHubLayout>
  );

  return (
    <SupplierHubLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-1">Supplier Hub</p>
            <h1 className="text-2xl font-bold text-slate-900">Awarded Orders</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your manufacturing workflow</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
              {activeCount} active
            </span>
            {deliveredCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                {deliveredCount} delivered
              </span>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Filter / Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by part name, job ID, or material…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 shadow-sm transition-all"
            />
          </div>

          {/* Stage filter pills */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0">
            {[
              { key: 'all',       label: 'All' },
              { key: 'active',    label: 'Active' },
              { key: 'delivered', label: 'Delivered' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStageFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  stageFilter === key
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative shrink-0">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="pl-8 pr-4 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-orange-400 shadow-sm appearance-none cursor-pointer"
            >
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="stage">By stage</option>
              <option value="name">By name</option>
            </select>
          </div>
        </div>

        {/* Confirm Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={open => {
          if (!open) setConfirmDialog({ open: false, orderId: null, newStatus: null, orderName: '', fromStage: '', toStage: '', note: '' });
        }}>
          <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-slate-900">
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                Confirm Stage Advance
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                This will be visible to the client and admin in real-time.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Order</p>
                <p className="font-semibold text-slate-900">{confirmDialog.orderName}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">From</p>
                  <p className="text-sm font-semibold text-slate-600">{confirmDialog.fromStage}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-400 shrink-0" />
                <div className="flex-1 bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-orange-400 mb-1">To</p>
                  <p className="text-sm font-semibold text-orange-600">{confirmDialog.toStage}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Note <span className="font-normal opacity-60">(optional — sent to client & admin)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what was completed or any notes…"
                  value={confirmDialog.note}
                  onChange={e => setConfirmDialog(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-1">
              <button
                onClick={() => setConfirmDialog({ open: false, orderId: null, newStatus: null, orderName: '', fromStage: '', toStage: '', note: '' })}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateOrderStatus(confirmDialog.orderId, confirmDialog.newStatus, confirmDialog.note)}
                disabled={!!updatingOrder}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 active:scale-[0.98] disabled:opacity-60 transition-all shadow-sm hover:shadow"
              >
                {updatingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Confirm & Advance
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Empty state */}
        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-white border border-slate-200">
            <Package className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-500">
              {search || stageFilter !== 'all' ? 'No orders match your filters' : 'No awarded orders yet'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {search || stageFilter !== 'all' ? 'Try adjusting your search or filter' : 'Check back after your bids are accepted'}
            </p>
          </div>
        )}

        {/* Order list */}
        <div className="space-y-2">
          {filteredOrders.map(order => {
            const stage      = STAGES.find(s => s.id === order.order_status);
            const stageColor = stage?.hex || ACCENT;
            const pipeline   = buildPipeline(order.selected_processes);
            const currentIdx = pipeline.indexOf(order.order_status);
            const nextStageId = currentIdx >= 0 && currentIdx < pipeline.length - 1 ? pipeline[currentIdx + 1] : null;
            const nextStage  = nextStageId
              ? (STAGES.find(s => s.id === nextStageId) || { id: nextStageId, label: nextStageId, icon: Package, hex: ACCENT })
              : null;
            const isDelivered = order.order_status === 'DELIVERED';

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                style={{ borderLeft: `3px solid ${stageColor}` }}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 px-4 py-3.5">

                  {/* Job ID */}
                  <span className="text-xs font-mono font-bold shrink-0 text-slate-500">
                    {order.rz_job_id || order.id.slice(0, 8).toUpperCase()}
                  </span>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {order.part_name || order.ghost_public_name || 'Unnamed Order'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {[order.material && `${order.material}`, order.quantity && `Qty ${order.quantity}`].filter(Boolean).join(' · ')}
                      {order.updated_at && ` · Updated ${format(new Date(order.updated_at), 'dd MMM')}`}
                    </p>
                  </div>

                  {/* Progress strip */}
                  <div className="hidden md:block w-28 shrink-0">
                    <StageProgress pipeline={pipeline} currentStatus={order.order_status} isDark={isDark} />
                    <p className="text-[10px] text-slate-400 mt-1 text-center">
                      Step {currentIdx + 1} of {pipeline.length}
                    </p>
                  </div>

                  {/* Stage badge */}
                  <span
                    className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
                    style={{ background: `${stageColor}12`, color: stageColor }}
                  >
                    {stage?.icon && <stage.icon className="w-3 h-3" />}
                    {stage?.label || order.order_status}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isDelivered && nextStage && (
                      <button
                        onClick={() => confirmStageChange(order.id, nextStage.id)}
                        disabled={updatingOrder === order.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 active:scale-[0.97] disabled:opacity-50 transition-all shadow-sm"
                      >
                        {updatingOrder === order.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <ChevronRight className="w-3 h-3" />
                        }
                        Advance
                      </button>
                    )}
                    {isDelivered && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 px-2.5 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" /> Delivered
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/supplier-hub/job-tracking/${order.rz_job_id}`)}
                      disabled={!order.rz_job_id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </div>
                </div>
                {/* Order Messages collapsible */}
                <div className="border-t border-slate-200">
                  <button
                    onClick={() => setExpandedMessages(prev => {
                      const next = new Set(prev);
                      next.has(order.id) ? next.delete(order.id) : next.add(order.id);
                      return next;
                    })}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-600">Order Messages</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-auto transition-transform ${expandedMessages.has(order.id) ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedMessages.has(order.id) && (
                    <div className="px-4 pb-4">
                      <OrderMessageThread orderId={order.id} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </SupplierHubLayout>
  );
}
