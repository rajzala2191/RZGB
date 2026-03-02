import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import ControlCentreLayout from '@/components/ControlCentreLayout';

export default function SanitisationGatePage() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').eq('order_status', 'PENDING_ADMIN_SCRUB');
    if (error) {
      console.error('Failed to fetch pending orders:', error);
      return;
    }
    if (data && data.length > 0) {
      // Fetch client names separately
      const clientIds = [...new Set(data.map(o => o.client_id).filter(Boolean))];
      const { data: profiles } = await supabase.from('profiles').select('id, company_name').in('id', clientIds);
      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p.company_name; });
      setOrders(data.map(o => ({ ...o, client_company_name: profileMap[o.client_id] || 'Unknown' })));
    } else {
      setOrders(data || []);
    }
  };

  return (
    <ControlCentreLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Sanitisation Gate</h1>
          <p className="text-slate-400 mt-1">Review and scrub pending orders before releasing to suppliers.</p>
        </div>

        <div className="bg-[#0f172a] rounded-lg shadow-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e293b] border-b border-slate-800 text-slate-300">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Client</th>
                <th className="p-4">Part Name</th>
                <th className="p-4">Material</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500">{order.id.slice(0, 8)}</td>
                  <td className="p-4">{order.client_company_name || 'Unknown'}</td>
                  <td className="p-4 font-semibold">{order.part_name}</td>
                  <td className="p-4">{order.material}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-700/50">PENDING</span>
                  </td>
                  <td className="p-4">
                    <Button size="sm" onClick={() => navigate(`/control-centre/sanitisation-gate/review/${order.id}`)} className="bg-cyan-600 hover:bg-cyan-500 text-white">Review</Button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No pending orders.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ControlCentreLayout>
  );
}