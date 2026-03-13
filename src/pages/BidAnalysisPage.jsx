import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import ControlCentreLayout from '@/components/ControlCentreLayout';

export default function BidAnalysisPage() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrdersWithBids();
  }, []);

  const fetchOrdersWithBids = async () => {
    // Fetch orders that are open for bidding or have bids
    const { data } = await supabase.from('orders').select('*').in('order_status', ['OPEN_FOR_BIDDING', 'BID_RECEIVED']);
    if (data) setOrders(data);
  };

  return (
    <ControlCentreLayout>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold text-slate-100">Bid Analysis</h1>
        
        <div className="bg-[#0f172a] rounded-lg shadow-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e293b] border-b border-slate-800 text-slate-300">
              <tr>
                <th className="p-4">Ghost Name</th>
                <th className="p-4">Material</th>
                <th className="p-4">Target Price</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-100">{o.ghost_public_name}</td>
                  <td className="p-4">{o.material}</td>
                  <td className="p-4 text-cyan-400">${o.target_sell_price}</td>
                  <td className="p-4">
                    <span className="bg-blue-900/30 text-blue-400 border border-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                      {o.order_status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button size="sm" onClick={() => navigate(`/control-centre/bid-analysis/compare/${o.id}`)} className="bg-slate-800 hover:bg-slate-700 text-white">Compare Bids</Button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No active bids.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ControlCentreLayout>
  );
}