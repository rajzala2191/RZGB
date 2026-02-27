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
    const { data } = await supabase.from('orders').select('*, client:client_id(company_name)').eq('order_status', 'PENDING_ADMIN_SCRUB');
    if (data) setOrders(data);
  };

  return (
    <ControlCentreLayout>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold">Sanitisation Gate</h1>
        <p className="text-gray-600">Review and scrub pending orders before releasing to suppliers.</p>

        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Client</th>
                <th className="p-4">Part Name</th>
                <th className="p-4">Material</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono">{order.id.slice(0, 8)}</td>
                  <td className="p-4">{order.client?.company_name || 'Unknown'}</td>
                  <td className="p-4">{order.part_name}</td>
                  <td className="p-4">{order.material}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">PENDING</span></td>
                  <td className="p-4">
                    <Button size="sm" onClick={() => navigate(`/control-centre/sanitisation-gate/review/${order.id}`)}>Review</Button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No pending orders.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ControlCentreLayout>
  );
}