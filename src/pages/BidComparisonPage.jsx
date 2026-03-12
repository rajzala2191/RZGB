import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { fetchBidsForOrder, awardBid, updateBidStatus } from '@/services/bidService';
import { fetchOrderById } from '@/services/orderService';
import { createNotification } from '@/lib/createNotification';
import { createAuditLog } from '@/lib/auditLogger';
import { format } from 'date-fns';
import {
  Gavel, Trophy, XCircle, ArrowLeft, Clock, DollarSign,
  Star, Building2, FileText, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';

const WEIGHT_PRICE = 0.5;
const WEIGHT_LEAD = 0.3;
const WEIGHT_NOTES = 0.2;

function scoreBids(bids) {
  if (!bids.length) return [];
  const minPrice = Math.min(...bids.map(b => b.amount));
  const maxPrice = Math.max(...bids.map(b => b.amount));
  const minLead = Math.min(...bids.map(b => b.lead_time_days));
  const maxLead = Math.max(...bids.map(b => b.lead_time_days));
  const priceRange = maxPrice - minPrice || 1;
  const leadRange = maxLead - minLead || 1;

  return bids.map(bid => {
    const priceScore = 100 - ((bid.amount - minPrice) / priceRange) * 100;
    const leadScore = 100 - ((bid.lead_time_days - minLead) / leadRange) * 100;
    const notesScore = bid.notes?.length > 20 ? 70 : bid.notes?.length > 0 ? 40 : 0;
    const total = Math.round(priceScore * WEIGHT_PRICE + leadScore * WEIGHT_LEAD + notesScore * WEIGHT_NOTES);
    return { ...bid, score: total, priceScore: Math.round(priceScore), leadScore: Math.round(leadScore) };
  }).sort((a, b) => b.score - a.score);
}

export default function BidComparisonPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [awarding, setAwarding] = useState(null);
  const [expandedBid, setExpandedBid] = useState(null);

  useEffect(() => { loadData(); }, [orderId]);

  const loadData = async () => {
    setLoading(true);
    const [orderRes, bidsRes] = await Promise.all([
      fetchOrderById(orderId),
      fetchBidsForOrder(orderId),
    ]);
    if (orderRes.data) setOrder(orderRes.data);
    if (bidsRes.data) setBids(scoreBids(bidsRes.data));
    setLoading(false);
  };

  const handleAward = async (bid) => {
    setAwarding(bid.id);
    try {
      const { rzJobId } = await awardBid(bid.id, orderId, bid.supplier_id);

      await createAuditLog({
        userId: currentUser?.id,
        action: 'BID_AWARDED',
        orderId,
        details: `Awarded bid to ${bid.supplier?.company_name}. Job ID: ${rzJobId}. Amount: ${bid.currency} ${bid.amount}`,
        status: 'success',
      });

      await createNotification({
        recipientId: bid.supplier_id,
        senderId: currentUser?.id,
        type: 'BID_AWARDED',
        title: 'Bid Awarded!',
        message: `Your bid for order ${order?.ghost_public_name || order?.part_name} has been accepted. Job ID: ${rzJobId}`,
        link: `/supplier-hub/job-tracking/${rzJobId}`,
      });

      const rejectedBids = bids.filter(b => b.id !== bid.id && b.status === 'pending');
      if (rejectedBids.length > 0) {
        await createNotification({
          recipientId: rejectedBids.map(b => b.supplier_id),
          senderId: currentUser?.id,
          type: 'BID_REJECTED',
          title: 'Bid Not Selected',
          message: `Your bid for order ${order?.ghost_public_name || order?.part_name} was not selected.`,
        });
      }

      toast({ title: 'Bid Awarded', description: `Order awarded to ${bid.supplier?.company_name}. Job ID: ${rzJobId}` });
      navigate('/control-centre/bid-management');
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to award bid.', variant: 'destructive' });
    } finally {
      setAwarding(null);
    }
  };

  const scoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <button onClick={() => navigate('/control-centre/bid-management')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-orange-500 transition-colors">
          <ArrowLeft size={14} /> Back to Bid Management
        </button>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Bid Evaluation</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">
            Compare Bids{order ? ` — ${order.ghost_public_name || order.part_name}` : ''}
          </h1>
          {order && (
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-slate-400">
              {order.rz_job_id && <span className="font-mono text-orange-500">{order.rz_job_id}</span>}
              {order.material && <span>{order.material}</span>}
              {order.quantity && <span>{order.quantity} units</span>}
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" /> Loading bids…</div>
        ) : bids.length === 0 ? (
          <div className="py-20 text-center">
            <Gavel className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No bids received yet.</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 text-xs text-gray-500 dark:text-slate-400">
              Ranking uses weighted scoring: Price {WEIGHT_PRICE * 100}%, Lead Time {WEIGHT_LEAD * 100}%, Detail {WEIGHT_NOTES * 100}%
            </div>

            <div className="space-y-3">
              {bids.map((bid, idx) => (
                <div key={bid.id} className={`bg-white dark:bg-[#18181b] border rounded-2xl overflow-hidden transition-colors ${
                  idx === 0 ? 'border-emerald-300 dark:border-emerald-800' : 'border-gray-200 dark:border-[#232329]'
                }`}>
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                      idx === 0 ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-[#232329] text-gray-500 dark:text-slate-400'
                    }`}>
                      {idx === 0 ? <Trophy size={18} /> : `#${idx + 1}`}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Building2 size={13} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{bid.supplier?.company_name || 'Supplier'}</span>
                        {bid.status !== 'pending' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                            bid.status === 'awarded' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-500 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'
                          }`}>
                            {bid.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-gray-800 dark:text-slate-200">
                          <DollarSign size={11} /> {bid.currency} {Number(bid.amount).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {bid.lead_time_days} days</span>
                        <span className="flex items-center gap-1"><FileText size={11} /> {format(new Date(bid.submitted_at), 'dd MMM yyyy HH:mm')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center">
                        <p className={`text-xl font-black ${scoreColor(bid.score)}`}>{bid.score}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Score</p>
                      </div>

                      {bid.status === 'pending' && order?.order_status === 'OPEN_FOR_BIDDING' && (
                        <Button onClick={() => handleAward(bid)} disabled={!!awarding}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold">
                          {awarding === bid.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <Trophy size={14} className="mr-1" />}
                          Award
                        </Button>
                      )}

                      <button onClick={() => setExpandedBid(expandedBid === bid.id ? null : bid.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                        {expandedBid === bid.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {expandedBid === bid.id && (
                    <div className="border-t border-gray-100 dark:border-[#232329] p-4 sm:p-5 bg-gray-50/50 dark:bg-[#131316]">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 rounded-lg bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329]">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Price Score</p>
                          <p className={`text-lg font-black ${scoreColor(bid.priceScore)}`}>{bid.priceScore}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329]">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Lead Score</p>
                          <p className={`text-lg font-black ${scoreColor(bid.leadScore)}`}>{bid.leadScore}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329]">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Weighted Total</p>
                          <p className={`text-lg font-black ${scoreColor(bid.score)}`}>{bid.score}</p>
                        </div>
                      </div>

                      {bid.price_breakdown && Object.keys(bid.price_breakdown).length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-2">Price Breakdown</p>
                          <div className="space-y-1">
                            {Object.entries(bid.price_breakdown).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-slate-400">{k}</span>
                                <span className="font-semibold text-gray-800 dark:text-slate-200">{bid.currency} {Number(v).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {bid.notes && (
                        <div>
                          <p className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Supplier Notes</p>
                          <p className="text-sm text-gray-700 dark:text-slate-300">{bid.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ControlCentreLayout>
  );
}
