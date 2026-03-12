import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import OpenForBiddingModal from '@/components/OpenForBiddingModal';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchBidCountsForOrders } from '@/services/bidService';
import { format } from 'date-fns';
import {
  Gavel, Search, Package, Layers, Hash, Calendar, Timer,
  ChevronRight, Eye, Users, SendHorizonal, MessageCircleQuestion,
} from 'lucide-react';

export default function BidManagementPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [bidCounts, setBidCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openModal, setOpenModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabaseAdmin
      .from('orders')
      .select('*')
      .in('order_status', ['SANITIZED', 'OPEN_FOR_BIDDING', 'BID_RECEIVED', 'AWARDED'])
      .order('updated_at', { ascending: false });

    if (data) {
      setOrders(data);
      const ids = data.map(o => o.id);
      if (ids.length > 0) {
        const { data: bids } = await fetchBidCountsForOrders(ids);
        const counts = {};
        bids?.forEach(b => { counts[b.order_id] = (counts[b.order_id] || 0) + 1; });
        setBidCounts(counts);
      }
    }
    setLoading(false);
  };

  const filtered = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      (o.rz_job_id || o.id).toLowerCase().includes(term) ||
      (o.ghost_public_name || o.part_name || '').toLowerCase().includes(term) ||
      (o.material || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' || o.order_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusMap = {
    SANITIZED:        { label: 'Ready to Open',    color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40 text-purple-600 dark:text-purple-400' },
    OPEN_FOR_BIDDING: { label: 'Open for Bidding', color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400' },
    BID_RECEIVED:     { label: 'Bids Received',    color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400' },
    AWARDED:          { label: 'Awarded',           color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' },
  };

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Procurement</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Bid Management</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Open orders for bidding, compare bids, and award suppliers.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 self-start sm:self-auto">
            <Gavel size={12} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {orders.filter(o => o.order_status === 'OPEN_FOR_BIDDING').length} Open Tenders
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input placeholder="Search by job ID, name or material…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-orange-500">
            <option value="all">All Statuses</option>
            <option value="SANITIZED">Ready to Open</option>
            <option value="OPEN_FOR_BIDDING">Open for Bidding</option>
            <option value="BID_RECEIVED">Bids Received</option>
            <option value="AWARDED">Awarded</option>
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 dark:text-slate-500 text-sm">Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
              {searchTerm || statusFilter !== 'all' ? 'No orders match your filters.' : 'No orders in the bidding pipeline.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const st = statusMap[order.order_status] || statusMap.SANITIZED;
              const count = bidCounts[order.id] || 0;
              return (
                <div key={order.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-orange-300 dark:hover:border-orange-800 transition-colors">
                  <div className="w-1 self-stretch rounded-full bg-amber-500 flex-shrink-0 hidden sm:block" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {order.rz_job_id && (
                        <span className="font-mono text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">{order.rz_job_id}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${st.color}`}>{st.label}</span>
                      {count > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Users size={10} /> {count} bid{count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{order.ghost_public_name || order.part_name || 'Unnamed Order'}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
                      {order.material && <span className="flex items-center gap-1"><Layers size={11} className="text-orange-500" /> {order.material}</span>}
                      {order.quantity && <span className="flex items-center gap-1"><Hash size={11} className="text-orange-500" /> {order.quantity} units</span>}
                      {order.bid_deadline && (
                        <span className="flex items-center gap-1">
                          <Timer size={11} /> Deadline {format(new Date(order.bid_deadline), 'dd MMM yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {order.order_status === 'SANITIZED' && (
                      <button onClick={() => { setSelectedOrder(order); setOpenModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-white transition-colors active:scale-95">
                        <SendHorizonal size={14} /> Open for Bidding
                      </button>
                    )}
                    {(order.order_status === 'OPEN_FOR_BIDDING' || order.order_status === 'BID_RECEIVED') && (
                      <button onClick={() => navigate(`/control-centre/rfq-qanda/${order.id}`)}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-[#232329] text-gray-500 dark:text-slate-400 hover:text-orange-500 hover:border-orange-300 transition-colors"
                        title="Q&A Board">
                        <MessageCircleQuestion size={14} />
                      </button>
                    )}
                    {(order.order_status === 'OPEN_FOR_BIDDING' || order.order_status === 'BID_RECEIVED') && count > 0 && (
                      <button onClick={() => navigate(`/control-centre/bid-comparison/${order.id}`)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors active:scale-95">
                        <Eye size={14} /> Compare Bids <ChevronRight size={14} />
                      </button>
                    )}
                    {order.order_status === 'AWARDED' && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">Awarded</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OpenForBiddingModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        order={selectedOrder}
        onSuccess={() => { loadOrders(); setOpenModal(false); }}
      />
    </ControlCentreLayout>
  );
}
