import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useToast } from '@/components/ui/use-toast';
import { Truck, Search, Loader2, CheckCircle2, Package, ExternalLink, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const CARRIER_TRACK_URL = {
  DHL:       (t) => `https://www.dhl.com/gb-en/home/tracking/tracking-express.html?submit=1&tracking-id=${t}`,
  FedEx:     (t) => `https://www.fedex.com/apps/fedextrack/?tracknumbers=${t}`,
  UPS:       (t) => `https://www.ups.com/track?tracknum=${t}`,
  RoyalMail: (t) => `https://www.royalmail.com/track-your-item#/tracking-results/${t}`,
};

const STATUS_CONFIG = {
  generated:  { label: 'Label Generated', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' },
  dispatched: { label: 'Dispatched',      color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60' },
  delivered:  { label: 'Delivered',       color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' },
};

export default function AdminShipmentsPage() {
  const { toast } = useToast();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(null); // shipment id being updated

  const fetchShipments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('shipping_labels')
        .select(`
          *,
          order:order_id ( id, part_name, rz_job_id, public_name, order_status, client_id,
            client:client_id ( company_name )
          ),
          supplier:supplier_id ( company_name )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setShipments(data || []);
    } catch (err) {
      toast({ title: 'Failed to load shipments', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const markDispatched = async (shipment) => {
    setUpdating(shipment.id);
    try {
      const now = new Date().toISOString();
      const { error: se } = await supabaseAdmin
        .from('shipping_labels')
        .update({ status: 'dispatched' })
        .eq('id', shipment.id);
      if (se) throw se;

      // Update order status to DISPATCH
      await supabaseAdmin
        .from('orders')
        .update({ order_status: 'DISPATCH', updated_at: now })
        .eq('id', shipment.order_id);

      toast({ title: 'Marked as Dispatched', description: `Order ${shipment.order?.rz_job_id || ''} is now in transit.` });
      fetchShipments(true);
    } catch (err) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const markDelivered = async (shipment) => {
    setUpdating(shipment.id);
    try {
      const now = new Date().toISOString();
      const { error: se } = await supabaseAdmin
        .from('shipping_labels')
        .update({ status: 'delivered' })
        .eq('id', shipment.id);
      if (se) throw se;

      // Update order status to DELIVERED
      await supabaseAdmin
        .from('orders')
        .update({ order_status: 'DELIVERED', updated_at: now })
        .eq('id', shipment.order_id);

      toast({ title: 'Marked as Delivered', description: `Order ${shipment.order?.rz_job_id || ''} delivered successfully.` });
      fetchShipments(true);
    } catch (err) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const filtered = shipments.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      (s.tracking_number || '').toLowerCase().includes(term) ||
      (s.order?.rz_job_id || '').toLowerCase().includes(term) ||
      (s.order?.part_name || '').toLowerCase().includes(term) ||
      (s.order?.client?.company_name || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const trackUrl = (s) => {
    const fn = CARRIER_TRACK_URL[s.carrier];
    return fn ? fn(s.tracking_number) : null;
  };

  return (
    <ControlCentreLayout>
      <Helmet><title>Shipments — Control Centre</title></Helmet>

      <div className="max-w-6xl mx-auto py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 flex items-center gap-3">
              <Truck className="text-sky-500" size={28} />
              Shipment Management
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
              Track and update all outbound shipments across orders.
            </p>
          </div>
          <button
            onClick={() => fetchShipments(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#232329] border border-gray-200 dark:border-[#232329] rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#2e2e35] transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={15} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search tracking number, job ID, part, or client…"
              className="w-full bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="generated">Label Generated</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-orange-500" size={36} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl py-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">No shipments found.</p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
              Shipping labels generated by suppliers will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s, i) => {
              const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.generated;
              const url = trackUrl(s);
              const isUpdating = updating === s.id;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">

                    {/* Left — order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                          {s.order?.part_name || 'Unnamed Order'}
                        </span>
                        {s.order?.rz_job_id && (
                          <span className="text-xs font-mono text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2 py-0.5 rounded-full">
                            {s.order.rz_job_id}
                          </span>
                        )}
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500 dark:text-slate-400">
                        <span><span className="font-semibold">{s.carrier}</span> · <span className="font-mono">{s.tracking_number}</span></span>
                        {s.order?.client?.company_name && <span>Client: {s.order.client.company_name}</span>}
                        {s.supplier?.company_name && <span>Supplier: {s.supplier.company_name}</span>}
                        <span>Generated: {format(new Date(s.created_at), 'dd MMM yyyy')}</span>
                        {s.dispatched_at && <span>Dispatched: {format(new Date(s.dispatched_at), 'dd MMM yyyy')}</span>}
                        {s.delivered_at && <span>Delivered: {format(new Date(s.delivered_at), 'dd MMM yyyy')}</span>}
                      </div>
                    </div>

                    {/* Right — actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#2e2e35] transition-colors"
                        >
                          <ExternalLink size={13} /> Track
                        </a>
                      )}
                      {s.status === 'generated' && (
                        <button
                          onClick={() => markDispatched(s)}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-60"
                        >
                          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
                          Mark Dispatched
                        </button>
                      )}
                      {s.status === 'dispatched' && (
                        <button
                          onClick={() => markDelivered(s)}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-60"
                        >
                          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Mark Delivered
                        </button>
                      )}
                      {s.status === 'delivered' && (
                        <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={13} /> Delivered
                        </span>
                      )}
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </ControlCentreLayout>
  );
}
