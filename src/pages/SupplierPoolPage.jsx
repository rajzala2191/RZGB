import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Search } from 'lucide-react';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import ReleaseToSuppliersModal from '@/components/ReleaseToSuppliersModal';

export default function SupplierPoolPage() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchSanitizedOrders();
  }, []);

  const fetchSanitizedOrders = async () => {
    const { data } = await supabase.from('orders').select('*').eq('order_status', 'SANITIZED').order('updated_at', { ascending: false });
    if (data) setOrders(data);
  };

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const filteredOrders = orders.filter(o => o.id.includes(searchTerm) || o.ghost_public_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <ControlCentreLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Assign to Supplier</h1>
            <p className="text-slate-400">Assign sanitized orders directly to suppliers.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <Input 
              placeholder="Search orders..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500"
            />
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-lg shadow-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e293b] border-b border-slate-800 text-slate-300">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Ghost Name</th>
                <th className="p-4">Material</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Sanitized Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-[#1e293b] transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-400">{order.id.slice(0, 8)}</td>
                  <td className="p-4 font-semibold text-cyan-400">{order.ghost_public_name}</td>
                  <td className="p-4">{order.material}</td>
                  <td className="p-4">{order.quantity}</td>
                  <td className="p-4 text-slate-400">{new Date(order.updated_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="bg-green-950 text-green-400 border border-green-800 px-2 py-1 rounded-full text-xs font-bold">
                      SANITIZED
                    </span>
                  </td>
                  <td className="p-4">
                    <Button size="sm" onClick={() => handleOpenModal(order)} className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2">
                      <Send size={14} /> Assign Supplier
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr><td colSpan="7" className="p-8 text-center text-slate-500">No sanitized orders available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReleaseToSuppliersModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        order={selectedOrder}
        onRefresh={fetchSanitizedOrders}
      />
    </ControlCentreLayout>
  );
}