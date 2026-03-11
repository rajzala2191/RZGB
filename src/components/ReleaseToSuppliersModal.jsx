import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createNotification } from '@/lib/createNotification';
import { useAuth } from '@/contexts/AuthContext';
import { X, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ReleaseToSuppliersModal({ order, isOpen, onClose, onRefresh }) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      setSelectedSupplierId('');
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'supplier');
    if (data) {
      setSuppliers(data.map(s => ({
        ...s,
        specialization: s.specialization || 'General Manufacturing',
      })));
    }
  };

  const handleAssign = async () => {
    if (!selectedSupplierId) {
      toast({ title: 'Validation', description: 'Please select a supplier.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Generate RZ Job ID
      const year = new Date().getFullYear();
      const rzJobId = `RZ-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Directly assign supplier and set order to AWARDED
      const { error: orderErr } = await supabase.from('orders').update({
        supplier_id: selectedSupplierId,
        order_status: 'AWARDED',
        rz_job_id: rzJobId,
        updated_at: new Date().toISOString()
      }).eq('id', order.id);
      if (orderErr) throw orderErr;

      // Stamp supplier_id on all existing documents for this order so supplier can access them
      await supabaseAdmin.from('documents')
        .update({ supplier_id: selectedSupplierId })
        .eq('order_id', order.id);

      // Create initial job update record
      await supabase.from('job_updates').insert({
        rz_job_id: rzJobId,
        stage: 'AWARDED',
        note: 'Order assigned to supplier. Production can begin.',
        updated_by: 'ADMIN'
      });

      await createNotification({
        recipientId: selectedSupplierId,
        senderId: currentUser?.id,
        type: 'ORDER_AWARDED',
        title: 'New Job Awarded',
        message: `You have been awarded job ${rzJobId} — ${order?.ghost_public_name || order?.part_name || 'New Order'}. Production can begin.`,
        link: `/supplier-hub/job-tracking/${rzJobId}`,
      });

      if (order?.client_id) {
        await createNotification({
          recipientId: order.client_id,
          senderId: currentUser?.id,
          type: 'ORDER_AWARDED',
          title: 'Order Awarded to Supplier',
          message: `Your order "${order?.part_name || 'Order'}" has been awarded to a supplier and production will begin shortly.`,
          link: `/client-dashboard/orders/${order.id}`,
        });
      }

      toast({ title: 'Supplier Assigned', description: `Order awarded to supplier. Job ID: ${rzJobId}` });
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Assign supplier error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to assign supplier.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Assign to Supplier</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Details */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Order ID:</span> <span className="font-mono text-slate-700">{order?.id?.slice(0, 8)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Sanitised Name:</span> <span className="font-semibold text-orange-500">{order?.ghost_public_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Material:</span> <span className="text-slate-700">{order?.material}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Quantity:</span> <span className="text-slate-700">{order?.quantity}</span></div>
          </div>

          {/* Supplier Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Select Supplier to Assign</label>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {suppliers.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSupplierId(s.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${
                    selectedSupplierId === s.id ? 'bg-orange-50 border-orange-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Building2 size={20} className={selectedSupplierId === s.id ? 'text-orange-500' : 'text-slate-400'} />
                  <div>
                    <p className="font-semibold text-slate-800">{s.company_name || s.email}</p>
                    <p className="text-xs text-slate-500">{s.specialization}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Info */}
          {selectedSupplier && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex gap-3 text-emerald-700 text-sm">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <p>Order will be directly awarded to <strong>{selectedSupplier.company_name || selectedSupplier.email}</strong>.</p>
                <p className="mt-1 opacity-80">Supplier will see the sanitised identity only (not client name). Production can start immediately.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-white">
          <Button variant="outline" onClick={onClose} className="border-slate-200 text-slate-700 hover:bg-slate-50">
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedSupplierId || loading} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            {loading ? 'Assigning...' : 'Assign & Award'}
          </Button>
        </div>
      </div>
    </div>
  );
}
