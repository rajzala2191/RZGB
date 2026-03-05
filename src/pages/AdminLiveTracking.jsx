import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Search, Filter, ArrowUpRight, Eye, Clock, AlertCircle,
  Package, FileCheck, CheckCircle2, Hourglass, ShieldCheck, Truck,
  Zap, XCircle, RefreshCw, TrendingUp, BarChart3, ChevronDown,
  ChevronUp, X, Calendar, DollarSign, MapPin, FileText
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/AdminContext';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import OrderTimeline from '@/components/OrderTimeline';
import DocumentPreview from '@/components/DocumentPreview';
import { format, formatDistanceToNow } from 'date-fns';

// Pipeline stage definitions
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

const STAGE_COLORS = {
  PENDING_ADMIN_SCRUB: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' },
  SANITIZED: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-500' },
  AWARDED: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
  MATERIAL: { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', dot: 'bg-sky-500' },
  CASTING: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' },
  MACHINING: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', dot: 'bg-violet-500' },
  QC: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  DISPATCH: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' },
  DELIVERED: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-500' },
  WITHDRAWN: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' },
};

// Statuses considered "ongoing" (not completed or withdrawn)
const ONGOING_STATUSES = ['PENDING_ADMIN_SCRUB', 'SANITIZED', 'AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH'];

const AdminLiveTracking = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { orders: allOrders, loading: ordersLoading, refreshData } = useOrders();

  const [jobUpdates, setJobUpdates] = useState({});
  const [orderDocuments, setOrderDocuments] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'created' | 'risk'

  // Fetch job_updates for all ongoing orders
  useEffect(() => {
    if (!currentUser) return;
    const fetchUpdates = async () => {
      const { data, error } = await supabase
        .from('job_updates')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        const grouped = {};
        data.forEach(u => {
          if (!grouped[u.rz_job_id]) grouped[u.rz_job_id] = [];
          grouped[u.rz_job_id].push(u);
        });
        setJobUpdates(grouped);
      }
    };

    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('documents')
          .select('id, order_id, file_name, file_path, file_type, status, created_at')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const grouped = {};
          data.forEach(doc => {
            if (!grouped[doc.order_id]) grouped[doc.order_id] = [];
            grouped[doc.order_id].push(doc);
          });
          setOrderDocuments(grouped);
        }
      } catch (err) {
        console.error('Error fetching documents for admin tracking:', err);
      }
    };

    fetchUpdates();
    fetchDocuments();

    // Realtime subscription for updates
    const channel = supabase
      .channel('admin-live-tracking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_updates' }, () => fetchUpdates())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchDocuments())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser]);

  // Filter to ongoing orders only
  const ongoingOrders = useMemo(() => {
    return allOrders.filter(o => ONGOING_STATUSES.includes(o.order_status));
  }, [allOrders]);

  // Apply search + stage filter + sort
  const filteredOrders = useMemo(() => {
    let result = ongoingOrders;

    if (stageFilter !== 'ALL') {
      result = result.filter(o => o.order_status === stageFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        (o.part_name || '').toLowerCase().includes(q) ||
        (o.ghost_public_name || '').toLowerCase().includes(q) ||
        (o.rz_job_id || '').toLowerCase().includes(q) ||
        (o.id || '').toLowerCase().includes(q) ||
        (o.material || '').toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'risk') {
        const riskA = getDaysRemaining(a);
        const riskB = getDaysRemaining(b);
        return riskA - riskB; // most at-risk first
      }
      if (sortBy === 'created') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      // default: updated
      return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    });

    return result;
  }, [ongoingOrders, stageFilter, searchQuery, sortBy]);

  // Stage breakdown counts
  const stageCounts = useMemo(() => {
    const counts = {};
    ONGOING_STATUSES.forEach(s => { counts[s] = 0; });
    ongoingOrders.forEach(o => {
      if (counts[o.order_status] !== undefined) counts[o.order_status]++;
    });
    return counts;
  }, [ongoingOrders]);

  const getDaysRemaining = (order) => {
    const daysRequested = order.delivery_days || 60;
    const orderDate = new Date(order.created_at);
    const dueDate = new Date(orderDate.getTime() + daysRequested * 24 * 60 * 60 * 1000);
    return Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getStageLabel = (status) => {
    const stage = STAGES.find(s => s.id === status);
    return stage?.label || status?.replace(/_/g, ' ') || 'Unknown';
  };

  const getStageIcon = (status) => {
    const stage = STAGES.find(s => s.id === status);
    return stage?.icon || Package;
  };

  if (ordersLoading) {
    return (
      <ControlCentreLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-cyan-500 w-12 h-12" />
        </div>
      </ControlCentreLayout>
    );
  }

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>Live Order Tracking — Admin</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Live Order Tracking</h1>
            <p className="text-slate-400 text-sm">
              Real-time overview of <span className="text-cyan-400 font-semibold">{ongoingOrders.length}</span> ongoing orders across the manufacturing pipeline.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stage Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {ONGOING_STATUSES.map(status => {
            const stage = STAGES.find(s => s.id === status);
            const colors = STAGE_COLORS[status];
            const Icon = stage?.icon || Package;
            const isActive = stageFilter === status;

            return (
              <button
                key={status}
                onClick={() => setStageFilter(isActive ? 'ALL' : status)}
                className={`relative group rounded-xl p-3 border transition-all text-left ${
                  isActive
                    ? `${colors.bg} ${colors.border} ring-1 ring-offset-0 ring-offset-slate-950 ${colors.border}`
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${colors.dot} ${stageCounts[status] > 0 ? 'animate-pulse' : ''}`} />
                  <Icon size={14} className={isActive ? colors.text : 'text-slate-500'} />
                </div>
                <p className={`text-xl font-bold ${isActive ? colors.text : 'text-slate-200'}`}>
                  {stageCounts[status]}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium leading-tight">
                  {stage?.label || status}
                </p>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by part name, job ID, material..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="updated">Sort: Last Updated</option>
              <option value="created">Sort: Newest First</option>
              <option value="risk">Sort: Most At-Risk</option>
            </select>

            {stageFilter !== 'ALL' && (
              <button
                onClick={() => setStageFilter('ALL')}
                className="flex items-center gap-1 px-3 py-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 hover:bg-cyan-500/20 transition-colors"
              >
                <X size={14} />
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-xl">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">
              {searchQuery || stageFilter !== 'ALL'
                ? 'No orders match your filters.'
                : 'No ongoing orders in the pipeline.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const colors = STAGE_COLORS[order.order_status] || STAGE_COLORS.PENDING_ADMIN_SCRUB;
              const StageIcon = getStageIcon(order.order_status);
              const daysRemaining = getDaysRemaining(order);
              const isOnTrack = daysRemaining > 0;
              const isExpanded = expandedOrder === order.id;
              const orderUpdates = order.rz_job_id ? (jobUpdates[order.rz_job_id] || []) : [];

              return (
                <motion.div
                  key={order.id}
                  layout
                  className={`bg-[#0f172a] border rounded-xl overflow-hidden transition-all ${
                    isExpanded ? 'border-cyan-500/40' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Row Header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    {/* Status dot + Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg} border ${colors.border}`}>
                      <StageIcon size={18} className={colors.text} />
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-white font-semibold text-sm truncate">
                          {order.ghost_public_name || order.part_name || 'Unnamed Order'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {getStageLabel(order.order_status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-mono">{order.rz_job_id || order.id?.slice(0, 8)}</span>
                        {order.material && <span>• {order.material}</span>}
                        {order.quantity && <span>• Qty: {order.quantity.toLocaleString()}</span>}
                      </div>
                    </div>

                    {/* Compact pipeline bar */}
                    <div className="hidden md:block flex-shrink-0 w-40 md:w-48">
                      <OrderTimeline
                        currentStatus={order.order_status}
                        compact={true}
                      />
                    </div>

                    {/* Timeline indicator */}
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-xs font-bold ${isOnTrack ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isOnTrack ? `${daysRemaining}d left` : `${Math.abs(daysRemaining)}d overdue`}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {formatDistanceToNow(new Date(order.updated_at || order.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Expand/Collapse */}
                    <div className="flex-shrink-0 text-slate-500">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-slate-800"
                      >
                        <div className="p-6 space-y-6">
                          {/* Detail cards row */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            <DetailCard label="Quantity" value={order.quantity ? order.quantity.toLocaleString() : '—'} icon={Package} color="text-blue-400" />
                            <DetailCard label="Material" value={order.material || '—'} icon={Zap} color="text-orange-400" />
                            <DetailCard label="Unit Price" value={order.unit_price ? `£${order.unit_price}` : '—'} icon={DollarSign} color="text-emerald-400" />
                            <DetailCard label="Delivery" value={`${order.delivery_days || 60} days`} icon={Calendar} color="text-amber-400" />
                            <DetailCard label="Location" value={order.delivery_to || 'TBD'} icon={MapPin} color="text-cyan-400" />
                          </div>

                          {/* Full Timeline */}
                          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                              <TrendingUp size={16} className="text-cyan-400" />
                              Manufacturing Pipeline
                            </h4>
                            <OrderTimeline
                              currentStatus={order.order_status}
                              createdAt={order.created_at}
                              updatedAt={order.updated_at}
                              updates={orderUpdates}
                              isWithdrawn={order.order_status === 'WITHDRAWN'}
                            />
                          </div>

                          {/* Latest Updates */}
                          {orderUpdates.length > 0 && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <FileText size={16} className="text-blue-400" />
                                Latest Updates
                              </h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {orderUpdates.slice(-5).reverse().map((update, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-semibold text-slate-300">
                                          {update.stage?.replace(/_/g, ' ')}
                                          <span className="text-slate-500 font-normal ml-1">• {update.status?.replace(/_/g, ' ')}</span>
                                        </p>
                                        <span className="text-[10px] text-slate-500 flex-shrink-0 font-mono">
                                          {format(new Date(update.created_at), 'dd MMM, HH:mm')}
                                        </span>
                                      </div>
                                      {update.notes && (
                                        <p className="text-xs text-slate-400 mt-1">{update.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Order Documents */}
                          {(orderDocuments[order.id] || []).length > 0 && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Eye size={16} className="text-emerald-400" />
                                Documents ({orderDocuments[order.id].length})
                              </h4>
                              <div className="space-y-3">
                                {orderDocuments[order.id].map(doc => (
                                  <DocumentPreview
                                    key={doc.id}
                                    filePath={doc.file_path}
                                    fileName={doc.file_name}
                                    compact={true}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action button */}
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/control-centre/sanitisation-gate/review/${order.id}`);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <Eye size={16} />
                              Open Full Review
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Summary footer */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>Showing <span className="text-slate-300 font-semibold">{filteredOrders.length}</span> of {ongoingOrders.length} ongoing orders</span>
            <span>•</span>
            <span>Total orders: <span className="text-slate-300 font-semibold">{allOrders.length}</span></span>
          </div>
          <div className="flex items-center gap-1 text-emerald-500">
            <ArrowUpRight size={12} />
            <span className="font-medium">Live</span>
            <span className="text-slate-500">Auto-updates via realtime</span>
          </div>
        </div>
      </motion.div>
    </ControlCentreLayout>
  );
};

// Sub-component: Detail card
const DetailCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-1">
      <Icon size={12} className={color} />
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</p>
    </div>
    <p className="text-sm font-bold text-slate-200 truncate">{value}</p>
  </div>
);

export default AdminLiveTracking;
