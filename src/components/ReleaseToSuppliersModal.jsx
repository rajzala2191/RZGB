import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { X, Building2, AlertCircle } from 'lucide-react';

export default function ReleaseToSuppliersModal({ order, isOpen, onClose, onRefresh }) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      setSelectedSupplierId('');
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    // Fetch users with role 'supplier'
    const { data } = await supabase.from('profiles').select('*').eq('role', 'supplier');
    if (data) {
      // Mocking specialization and rating if not present
      setSuppliers(data.map(s => ({
        ...s,
        specialization: 'General Manufacturing',
        rating: 4.8
      })));
    }
  };

  const handleRelease = async () => {
    if (!selectedSupplierId) {
      toast({ title: 'Validation', description: 'Please select a supplier.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Create tender request
      await supabase.from('tender_requests').insert([{
        project_id: order.project_id || order.id,
        status: 'OPEN',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }]);

      // Update order status to open for bidding (supplier_id set only when contract is awarded)
      await supabase.from('orders').update({
        order_status: 'OPEN_FOR_BIDDING'
      }).eq('id', order.id);

      toast({ title: 'Success', description: 'Order released to supplier successfully.' });
      onRefresh();
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">Release to Supplier</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Details */}
          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-700 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Order ID:</span> <span className="font-mono text-slate-200">{order?.id?.slice(0, 8)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Ghost Name:</span> <span className="font-semibold text-cyan-400">{order?.ghost_public_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Material:</span> <span className="text-slate-200">{order?.material}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Quantity:</span> <span className="text-slate-200">{order?.quantity}</span></div>
          </div>

          {/* Supplier Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-300">Select Supplier</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {suppliers.map(s => (
                <div 
                  key={s.id}
                  onClick={() => setSelectedSupplierId(s.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${
                    selectedSupplierId === s.id ? 'bg-cyan-900/20 border-cyan-500' : 'bg-[#1e293b] border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <Building2 size={20} className={selectedSupplierId === s.id ? 'text-cyan-400' : 'text-slate-500'} />
                  <div>
                    <p className="font-semibold text-slate-200">{s.company_name || s.email}</p>
                    <p className="text-xs text-slate-400">Spec: {s.specialization} • Rating: {s.rating}★</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Info */}
          {selectedSupplier && (
            <div className="bg-amber-950/30 border border-amber-900/50 p-4 rounded-lg flex gap-3 text-amber-200/90 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p>This order will be sent to <strong>{selectedSupplier.company_name || selectedSupplier.email}</strong>.</p>
                <p className="mt-1 opacity-80">Supplier will see: RZ_GLOBAL_INTERNAL (not client name).</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-[#0f172a]">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={handleRelease} disabled={!selectedSupplierId || loading} className="bg-cyan-600 hover:bg-cyan-500 text-white">
            {loading ? 'Processing...' : 'Release Tender'}
          </Button>
        </div>
      </div>
    </div>
  );
}