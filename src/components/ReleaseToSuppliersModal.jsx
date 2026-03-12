import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useToast } from '@/components/ui/use-toast';
import { createNotification } from '@/lib/createNotification';
import { useAuth } from '@/contexts/AuthContext';
import { X, Building2, CheckCircle2 } from 'lucide-react';

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
      const year = new Date().getFullYear();
      const rzJobId = `RZ-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { error: orderErr } = await supabase.from('orders').update({
        supplier_id: selectedSupplierId,
        order_status: 'AWARDED',
        rz_job_id: rzJobId,
        updated_at: new Date().toISOString()
      }).eq('id', order.id);
      if (orderErr) throw orderErr;

      await supabaseAdmin.from('documents')
        .update({ supplier_id: selectedSupplierId })
        .eq('order_id', order.id);

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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--edge)',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--edge)' }}
        >
          <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--heading)' }}>
            Assign to Supplier
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--body)', background: 'var(--surface-raised)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--heading)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--body)'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Order Details */}
          <div
            className="rounded-xl p-4 space-y-2 text-sm"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)' }}
          >
            {[
              { label: 'Order ID', value: order?.id?.slice(0, 8), mono: true },
              { label: 'Sanitised Name', value: order?.ghost_public_name, accent: true },
              { label: 'Material', value: order?.material },
              { label: 'Quantity', value: order?.quantity },
            ].map(({ label, value, mono, accent }) => value ? (
              <div key={label} className="flex justify-between gap-4">
                <span style={{ color: 'var(--body)' }}>{label}:</span>
                <span
                  className={mono ? 'font-mono' : 'font-medium text-right'}
                  style={{ color: accent ? 'var(--brand)' : 'var(--heading)' }}
                >
                  {value}
                </span>
              </div>
            ) : null)}
          </div>

          {/* Supplier Selection */}
          <div className="space-y-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>
              Select Supplier to Assign
            </p>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '36vh' }}>
              {suppliers.length === 0 && (
                <p className="text-sm text-center py-6" style={{ color: 'var(--body)' }}>
                  No suppliers found.
                </p>
              )}
              {suppliers.map(s => {
                const isSelected = selectedSupplierId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSupplierId(s.id)}
                    className="p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3"
                    style={{
                      background: isSelected ? 'rgba(255,107,53,0.08)' : 'var(--surface-raised)',
                      border: `1px solid ${isSelected ? 'var(--brand)' : 'var(--edge)'}`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isSelected ? 'rgba(255,107,53,0.12)' : 'var(--surface-inset)',
                      }}
                    >
                      <Building2
                        size={16}
                        style={{ color: isSelected ? 'var(--brand)' : 'var(--body)' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--heading)' }}>
                        {s.company_name || s.email}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--body)' }}>
                        {s.specialization}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirmation banner */}
          {selectedSupplier && (
            <div
              className="rounded-xl p-4 flex gap-3 text-sm"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#10b981',
              }}
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <p>
                  Order will be directly awarded to{' '}
                  <strong>{selectedSupplier.company_name || selectedSupplier.email}</strong>.
                </p>
                <p className="mt-1 opacity-80">
                  Supplier will see the sanitised identity only. Production can start immediately.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0"
          style={{ borderTop: '1px solid var(--edge)', background: 'var(--surface)' }}
        >
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--edge)',
              color: 'var(--heading)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedSupplierId || loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: '#10b981', color: '#ffffff' }}
          >
            {loading ? 'Assigning…' : 'Assign & Award'}
          </button>
        </div>
      </div>
    </div>
  );
}
