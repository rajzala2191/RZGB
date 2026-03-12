import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import SubmitBidModal from '@/components/SubmitBidModal';
import { fetchOpenOrdersForSupplier, fetchBidsBySupplier } from '@/services/bidService';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import {
  Search, Gavel, Package, Layers, Hash, Calendar,
  Clock, ChevronRight, CheckCircle2, XCircle, Timer, Loader2,
} from 'lucide-react';

export default function SupplierBiddingPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [openOrders, setOpenOrders] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('open');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { if (currentUser) loadData(); }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    const [ordersRes, bidsRes] = await Promise.all([
      fetchOpenOrdersForSupplier(currentUser.id),
      fetchBidsBySupplier(currentUser.id),
    ]);
    if (ordersRes.data) setOpenOrders(ordersRes.data);
    if (bidsRes.data) setMyBids(bidsRes.data);
    setLoading(false);
  };

  const [acceptingJob, setAcceptingJob] = useState(null);

  const handleAcceptJob = async (bid) => {
    setAcceptingJob(bid.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ po_signed_at: new Date().toISOString(), po_signed_by: currentUser.id })
        .eq('id', bid.order_id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'JOB_ACCEPTED',
        resource_type: 'order',
        resource_id: bid.order_id,
        details: `Supplier accepted job for order ${bid.order?.rz_job_id || bid.order_id}`,
        created_at: new Date().toISOString(),
      });

      toast({ title: 'Job Accepted', description: 'You have confirmed acceptance of this job.' });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAcceptingJob(null);
    }
  };

  const bidOrderIds = new Set(myBids.map(b => b.order_id));

  const availableOrders = openOrders.filter(o => !bidOrderIds.has(o.id));
  const filteredOpen = availableOrders.filter(o =>
    (o.rz_job_id || o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.ghost_public_name || o.part_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.material || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredBids = myBids.filter(b =>
    (b.order?.rz_job_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.order?.ghost_public_name || b.order?.part_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpired = (deadline) => deadline && new Date(deadline) < new Date();

  const statusBadge = (status) => {
    const map = {
      pending:     'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
      awarded:     'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
      rejected:    'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400',
      shortlisted: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
      withdrawn:   'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${map[status] || map.pending}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <SupplierHubLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Procurement</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Bidding Centre</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">View open tenders and submit competitive bids.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 self-start sm:self-auto">
            <Gavel size={12} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{availableOrders.length} Open Tenders</span>
          </div>
        </div>

        <div className="flex gap-2">
          {['open', 'mybids'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                tab === t
                  ? 'bg-orange-600 text-white'
                  : 'bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-gray-600 dark:text-slate-400 hover:border-orange-300'
              }`}
            >
              {t === 'open' ? `Open Tenders (${availableOrders.length})` : `My Bids (${myBids.length})`}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            placeholder="Search by job ID, name or material…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 dark:text-slate-500 text-sm">Loading…</div>
        ) : tab === 'open' ? (
          filteredOpen.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No open tenders available.</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Check back later for new bidding opportunities.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOpen.map(order => (
                <div key={order.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-orange-300 dark:hover:border-orange-800 transition-colors">
                  <div className="w-1 self-stretch rounded-full bg-amber-500 flex-shrink-0 hidden sm:block" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {order.rz_job_id && (
                        <span className="font-mono text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">{order.rz_job_id}</span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400">OPEN FOR BIDDING</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{order.ghost_public_name || order.part_name || 'Unnamed Order'}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
                      {order.material && <span className="flex items-center gap-1"><Layers size={11} className="text-orange-500" /> {order.material}</span>}
                      {order.quantity && <span className="flex items-center gap-1"><Hash size={11} className="text-orange-500" /> {order.quantity} units</span>}
                      {order.bid_deadline && (
                        <span className={`flex items-center gap-1 ${isExpired(order.bid_deadline) ? 'text-red-500' : ''}`}>
                          <Timer size={11} className={isExpired(order.bid_deadline) ? 'text-red-500' : 'text-orange-500'} />
                          {isExpired(order.bid_deadline) ? 'Expired' : `Deadline ${format(new Date(order.bid_deadline), 'dd MMM yyyy HH:mm')}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                    disabled={isExpired(order.bid_deadline)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors flex-shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Gavel size={14} /> Submit Bid <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredBids.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">You haven't submitted any bids yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBids.map(bid => (
                <div key={bid.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 hidden sm:block ${
                    bid.status === 'awarded' ? 'bg-emerald-500' : bid.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {bid.order?.rz_job_id && (
                        <span className="font-mono text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">{bid.order.rz_job_id}</span>
                      )}
                      {statusBadge(bid.status)}
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{bid.order?.ghost_public_name || bid.order?.part_name || 'Order'}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-slate-200">
                        {bid.currency} {Number(bid.amount).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {bid.lead_time_days} days lead time</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> Submitted {format(new Date(bid.submitted_at), 'dd MMM yyyy')}</span>
                    </div>
                  </div>
                  {bid.status === 'awarded' && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Won</span>
                      </div>
                      {!bid.order?.po_signed_at && (
                        <button
                          onClick={() => handleAcceptJob(bid)}
                          disabled={acceptingJob === bid.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-60 transition-colors"
                        >
                          {acceptingJob === bid.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Accept Job
                        </button>
                      )}
                      {bid.order?.po_signed_at && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 italic">Job Accepted</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <SubmitBidModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onSuccess={() => { loadData(); setIsModalOpen(false); }}
      />
    </SupplierHubLayout>
  );
}
