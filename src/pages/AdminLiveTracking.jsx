import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Search, ArrowRight, RefreshCw,
  Package, FileCheck, CheckCircle2, Hourglass,
  ShieldCheck, Truck, Zap, X,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useOrders } from '@/contexts/AdminContext';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import OrderTimeline from '@/components/OrderTimeline';
import { format, formatDistanceToNow } from 'date-fns';

// ── Stage config ────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'PENDING_ADMIN_SCRUB', label: 'Received',         icon: Package,      hex: '#3b82f6' },
  { id: 'SANITIZED',           label: 'Sanitized',         icon: FileCheck,    hex: '#a855f7' },
  { id: 'AWARDED',             label: 'Assigned',          icon: CheckCircle2, hex: '#f59e0b' },
  { id: 'MATERIAL',            label: 'Material',          icon: Package,      hex: '#0ea5e9' },
  { id: 'CASTING',             label: 'Casting',           icon: Zap,          hex: '#f97316' },
  { id: 'MACHINING',           label: 'Machining',         icon: Hourglass,    hex: '#8b5cf6' },
  { id: 'QC',                  label: 'QC',                icon: ShieldCheck,  hex: '#22c55e' },
  { id: 'DISPATCH',            label: 'Dispatch',          icon: Truck,        hex: '#06b6d4' },
];

const ONGOING = STAGES.map(s => s.id);

function getStageCfg(status) {
  return STAGES.find(s => s.id === status) || { label: status?.replace(/_/g, ' '), hex: '#f97316', icon: Package };
}

function getDaysRemaining(order) {
  const days = order.delivery_days || 60;
  const due  = new Date(new Date(order.created_at).getTime() + days * 86400000);
  return Math.ceil((due - Date.now()) / 86400000);
}

// ── Component ───────────────────────────────────────────────────────────────
export default function AdminLiveTracking() {
  const navigate = useNavigate();
  const { orders: allOrders, loading, refreshData } = useOrders();

  const [jobUpdates,  setJobUpdates]  = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [sortBy,      setSortBy]      = useState('updated');
  const [refreshing,  setRefreshing]  = useState(false);

  // Fetch all job_updates grouped by rz_job_id
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('job_updates').select('*').order('created_at', { ascending: true });
      if (data) {
        const grouped = {};
        data.forEach(u => { if (!grouped[u.rz_job_id]) grouped[u.rz_job_id] = []; grouped[u.rz_job_id].push(u); });
        setJobUpdates(grouped);
      }
    };
    fetch();
    const ch = supabase.channel('alt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_updates' }, fetch)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const ongoing = useMemo(() => allOrders.filter(o => ONGOING.includes(o.order_status)), [allOrders]);

  const filtered = useMemo(() => {
    let r = stageFilter === 'ALL' ? ongoing : ongoing.filter(o => o.order_status === stageFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(o =>
        (o.part_name || '').toLowerCase().includes(q) ||
        (o.rz_job_id || '').toLowerCase().includes(q) ||
        (o.material  || '').toLowerCase().includes(q)
      );
    }
    return [...r].sort((a, b) => {
      if (sortBy === 'risk')    return getDaysRemaining(a) - getDaysRemaining(b);
      if (sortBy === 'created') return new Date(b.created_at) - new Date(a.created_at);
      return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    });
  }, [ongoing, stageFilter, searchQuery, sortBy]);

  const stageCounts = useMemo(() => {
    const c = {};
    ONGOING.forEach(s => { c[s] = 0; });
    ongoing.forEach(o => { if (c[o.order_status] !== undefined) c[o.order_status]++; });
    return c;
  }, [ongoing]);

  const handleRefresh = async () => { setRefreshing(true); await refreshData(); setRefreshing(false); };

  if (loading) return (
    <ControlCentreLayout>
      <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
    </ControlCentreLayout>
  );

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Manufacturing Pipeline</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Live Tracking</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              <span className="font-semibold text-orange-500">{ongoing.length}</span> active orders across the pipeline
            </p>
          </div>
          <button
            onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#232329] transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Stage filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStageFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              stageFilter === 'ALL'
                ? 'bg-orange-600 border-orange-600 text-white'
                : 'bg-white dark:bg-[#18181b] border-gray-200 dark:border-[#232329] text-gray-600 dark:text-slate-400 hover:border-orange-400'
            }`}
          >
            All ({ongoing.length})
          </button>
          {STAGES.map(({ id, label, hex }) => {
            const count   = stageCounts[id] || 0;
            const active  = stageFilter === id;
            return (
              <button
                key={id}
                onClick={() => setStageFilter(active ? 'ALL' : id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  active ? 'text-white border-transparent' : 'bg-white dark:bg-[#18181b] border-gray-200 dark:border-[#232329] text-gray-600 dark:text-slate-400 hover:border-orange-400'
                }`}
                style={active ? { backgroundColor: hex, borderColor: hex } : {}}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hex }} />
                {label} {count > 0 && <span className="opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search part name, job ID, material…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="updated">Last Updated</option>
            <option value="created">Newest First</option>
            <option value="risk">Most At-Risk</option>
          </select>
        </div>

        {/* Orders */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl">
            <Package className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
              {searchQuery || stageFilter !== 'ALL' ? 'No orders match your filters.' : 'No active orders in the pipeline.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const cfg          = getStageCfg(order.order_status);
              const StageIcon    = cfg.icon;
              const daysLeft     = getDaysRemaining(order);
              const onTrack      = daysLeft > 0;
              const updates      = order.rz_job_id ? (jobUpdates[order.rz_job_id] || []) : [];
              const latestUpdate = updates[updates.length - 1];

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl overflow-hidden hover:border-orange-300 dark:hover:border-orange-800 transition-colors"
                >
                  {/* Top: coloured status strip */}
                  <div className="h-0.5" style={{ backgroundColor: cfg.hex }} />

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                      {/* Stage icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${cfg.hex}18`, border: `1px solid ${cfg.hex}40` }}
                      >
                        <StageIcon size={18} style={{ color: cfg.hex }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                            {order.ghost_public_name || order.part_name || 'Unnamed Order'}
                          </h3>
                          <span
                            className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${cfg.hex}18`, color: cfg.hex }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-slate-500">
                          {order.rz_job_id && <span className="font-mono text-orange-500">{order.rz_job_id}</span>}
                          {order.material   && <span>{order.material}</span>}
                          {order.quantity   && <span>Qty: {order.quantity.toLocaleString()}</span>}
                          <span className={onTrack ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-500 font-semibold'}>
                            {onTrack ? `${daysLeft}d remaining` : `${Math.abs(daysLeft)}d overdue`}
                          </span>
                          <span className="text-gray-400 dark:text-slate-600">
                            {formatDistanceToNow(new Date(order.updated_at || order.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Inline timeline */}
                        <div className="pt-2">
                          <OrderTimeline currentStatus={order.order_status} compact={true} />
                        </div>

                        {/* Latest update strip */}
                        {latestUpdate && (
                          <div className="flex items-start gap-2 pt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                            <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">
                              <span className="font-semibold text-gray-700 dark:text-slate-300">
                                {latestUpdate.stage?.replace(/_/g, ' ')}
                              </span>
                              {latestUpdate.notes && ` — ${latestUpdate.notes}`}
                              <span className="ml-2 font-mono text-[10px] text-gray-400 dark:text-slate-600">
                                {format(new Date(latestUpdate.created_at), 'dd MMM, HH:mm')}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* View Order button */}
                      <button
                        onClick={() => navigate(`/control-centre/order-preview/${order.id}`)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors flex-shrink-0 active:scale-95 self-start"
                      >
                        View Order <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 pt-1">
          <span>Showing <span className="font-semibold text-gray-700 dark:text-slate-300">{filtered.length}</span> of {ongoing.length} active orders</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live — auto-updates via realtime</span>
          </div>
        </div>

      </div>
    </ControlCentreLayout>
  );
}
