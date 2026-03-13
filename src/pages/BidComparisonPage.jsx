<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Award, DollarSign, Clock, Shield } from 'lucide-react';
import ControlCentreLayout from '@/components/ControlCentreLayout';
=======
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
  Star, Building2, FileText, ChevronDown, ChevronUp, Loader2, CheckCircle2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
>>>>>>> f2b56e8ef31c7e44cb81ed10e0035c92980644a1

<<<<<<< HEAD
export default function BidComparisonPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [bids, setBids] = useState([]);
  const [selectedBidId, setSelectedBidId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    const { data: ord } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (ord) setOrder(ord);

    const { data: bds } = await supabase.from('bid_submissions').select('*, supplier:supplier_id(company_name, email)').eq('tender_id', orderId);
    if (bds) setBids(bds);
  };

  const handleAward = async () => {
    if (!selectedBidId) {
      toast({ title: 'Error', description: 'Please select a bid.', variant: 'destructive' });
      return;
    }

    try {
      const selectedBid = bids.find(b => b.id === selectedBidId);

      await supabase.from('orders').update({
        order_status: 'AWARDED',
        supplier_id: selectedBid.supplier_id,
        buy_price: selectedBid.unit_price,
        rz_job_id: `RZ-JOB-${Math.floor(Math.random() * 100000)}`
      }).eq('id', orderId);

      // Update winning bid status
      await supabase.from('bid_submissions').update({ status: 'accepted' }).eq('id', selectedBidId);

      // Update losing bid statuses
      const losingBidIds = bids.filter(b => b.id !== selectedBidId).map(b => b.id);
      if (losingBidIds.length > 0) {
        await supabase.from('bid_submissions').update({ status: 'rejected' }).in('id', losingBidIds);
      }

      toast({ title: 'Success', description: 'Contract awarded successfully.' });
      navigate('/control-centre/bid-management');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (!order) return <ControlCentreLayout><div className="p-8 text-slate-300">Loading...</div></ControlCentreLayout>;

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto py-8 space-y-8">
        <h1 className="text-3xl font-bold text-slate-100">Compare Bids: <span className="text-cyan-400">{order.ghost_public_name}</span></h1>
        
        <div className="bg-[#0f172a] p-6 rounded-lg shadow-xl border border-slate-800 grid grid-cols-3 gap-6">
          <div className="flex flex-col items-center p-4 bg-[#1e293b] rounded-lg border border-slate-700">
            <DollarSign className="text-cyan-500 mb-2" size={24} />
            <span className="text-slate-400 text-sm">Target Price</span>
            <span className="text-xl font-bold text-slate-100">${order.target_sell_price}</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-[#1e293b] rounded-lg border border-slate-700">
            <Shield className="text-amber-500 mb-2" size={24} />
            <span className="text-slate-400 text-sm">Quantity</span>
            <span className="text-xl font-bold text-slate-100">{order.quantity}</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-[#1e293b] rounded-lg border border-slate-700">
            <Clock className="text-emerald-500 mb-2" size={24} />
            <span className="text-slate-400 text-sm">Bids Received</span>
            <span className="text-xl font-bold text-slate-100">{bids.length}</span>
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-lg shadow-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e293b] border-b border-slate-800 text-slate-300">
              <tr>
                <th className="p-4 w-16">Select</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Quote Price</th>
                <th className="p-4">Lead Time</th>
                <th className="p-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {bids.map(bid => (
                <tr key={bid.id} className={`hover:bg-slate-800/50 transition-colors ${selectedBidId === bid.id ? 'bg-cyan-900/20' : ''}`}>
                  <td className="p-4">
                    <input type="radio" name="bidSelection" checked={selectedBidId === bid.id} onChange={() => setSelectedBidId(bid.id)} className="h-5 w-5 rounded-full border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer" />
                  </td>
                  <td className="p-4 font-semibold text-slate-100">{bid.supplier?.company_name || bid.supplier?.email || 'Unknown'}</td>
                  <td className={`p-4 font-bold ${parseFloat(bid.unit_price) <= parseFloat(order.target_sell_price) ? 'text-green-400' : 'text-amber-400'}`}>
                    ${bid.unit_price}
                  </td>
                  <td className="p-4">{bid.lead_time_days} days</td>
                  <td className="p-4 text-slate-400 text-xs max-w-xs truncate">{bid.notes || 'N/A'}</td>
                </tr>
              ))}
              {bids.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No bids received yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Button onClick={handleAward} size="lg" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 text-lg shadow-lg shadow-emerald-900/20" disabled={bids.length === 0 || !selectedBidId}>
          <Award className="mr-2" size={24} /> AWARD CONTRACT
        </Button>
      </div>
    </ControlCentreLayout>
  );
}
=======
const WEIGHT_PRICE = 0.5;
const WEIGHT_LEAD = 0.3;
const WEIGHT_NOTES = 0.2;

export function scoreBids(bids) {
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
  const [awardLetterBid, setAwardLetterBid] = useState(null); // bid pending confirmation in modal

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
            <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 text-xs text-gray-500 dark:text-slate-400 space-y-1">
              <div>Ranking uses weighted scoring: Price {WEIGHT_PRICE * 100}%, Lead Time {WEIGHT_LEAD * 100}%, Detail {WEIGHT_NOTES * 100}%</div>
              {new Set(bids.map(b => b.currency)).size > 1 && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  <DollarSign size={11} /> Note: bids are in different currencies — compare amounts carefully.
                </div>
              )}
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
                        <Button onClick={() => setAwardLetterBid(bid)} disabled={!!awarding}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold">
                          <Trophy size={14} className="mr-1" />
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
      {/* Award Letter confirmation modal */}
      <Dialog open={!!awardLetterBid} onOpenChange={open => { if (!open) setAwardLetterBid(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-gray-900 dark:text-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <Trophy size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              Award Letter Summary
            </DialogTitle>
          </DialogHeader>
          {awardLetterBid && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 dark:bg-[#13131f] rounded-xl p-4 space-y-3 border border-gray-200 dark:border-[#232329]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Supplier</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">{awardLetterBid.supplier?.company_name || 'Supplier'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Order</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{order?.ghost_public_name || order?.part_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Amount</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{awardLetterBid.currency} {Number(awardLetterBid.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Lead Time</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{awardLetterBid.lead_time_days} days</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                By confirming, you award this job to the supplier. They will be notified immediately.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 pt-1">
            <button
              onClick={() => setAwardLetterBid(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-[#232329] hover:bg-gray-200 dark:hover:bg-[#2e2e35] text-gray-600 dark:text-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { const bid = awardLetterBid; setAwardLetterBid(null); handleAward(bid); }}
              disabled={!!awarding}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition-all shadow-sm"
            >
              {awarding ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Confirm Award
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ControlCentreLayout>
  );
}

>>>>>>> f2b56e8ef31c7e44cb81ed10e0035c92980644a1