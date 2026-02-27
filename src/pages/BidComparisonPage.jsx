import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Award, DollarSign, Clock, Shield } from 'lucide-react';
import ControlCentreLayout from '@/components/ControlCentreLayout';

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
        buy_price: selectedBid.quote_price,
        rz_job_id: `RZ-JOB-${Math.floor(Math.random() * 100000)}`
      }).eq('id', orderId);

      await supabase.from('supplier_order_link').insert([{
        order_id: orderId,
        supplier_id: selectedBid.supplier_id,
        bid_id: selectedBidId,
        admin_id: currentUser.id
      }]);

      toast({ title: 'Success', description: 'Contract awarded successfully.' });
      navigate('/control-centre/bid-analysis');
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
                  <td className={`p-4 font-bold ${parseFloat(bid.quote_price) <= parseFloat(order.target_sell_price) ? 'text-green-400' : 'text-amber-400'}`}>
                    ${bid.quote_price}
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