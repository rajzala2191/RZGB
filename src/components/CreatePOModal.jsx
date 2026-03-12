import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createPurchaseOrder } from '@/services/poService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { X, FileText, Plus, Trash2 } from 'lucide-react';

export default function CreatePOModal({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [awardedOrders, setAwardedOrders] = useState([]);
  const [form, setForm] = useState({
    orderId: '',
    paymentTerms: 'Net 30',
    deliveryDate: '',
    notes: '',
  });
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    if (isOpen) fetchAwardedOrders();
  }, [isOpen]);

  const fetchAwardedOrders = async () => {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('id, rz_job_id, part_name, ghost_public_name, supplier_id, buy_price, material, quantity')
      .eq('order_status', 'AWARDED')
      .order('updated_at', { ascending: false });
    if (data) setAwardedOrders(data);
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const updateLineItem = (idx, field, val) =>
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: val };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.unit_price) || 0);
      }
      return updated;
    }));

  const addLine = () => setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeLine = (idx) => setLineItems(prev => prev.filter((_, i) => i !== idx));

  const total = lineItems.reduce((sum, li) => sum + ((parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0)), 0);

  const selectedOrder = awardedOrders.find(o => o.id === form.orderId);

  const handleCreate = async () => {
    if (!form.orderId) {
      toast({ title: 'Validation', description: 'Please select an order.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const items = lineItems.map(li => ({
        description: li.description,
        quantity: parseFloat(li.quantity) || 0,
        unit_price: parseFloat(li.unit_price) || 0,
        total: (parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0),
      }));

      const { data, error } = await createPurchaseOrder({
        orderId: form.orderId,
        supplierId: selectedOrder.supplier_id,
        lineItems: items,
        totalAmount: total,
        currency: 'GBP',
        paymentTerms: form.paymentTerms,
        deliveryDate: form.deliveryDate || null,
        notes: form.notes,
        createdBy: currentUser?.id,
      });

      if (error) throw error;
      toast({ title: 'PO Created', description: `Purchase order ${data.po_number} created as draft.` });
      setForm({ orderId: '', paymentTerms: 'Net 30', deliveryDate: '', notes: '' });
      setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
      onSuccess();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to create PO.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-[#232329]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <FileText size={18} className="text-orange-500" /> Create Purchase Order
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Awarded Order *</label>
            <select value={form.orderId} onChange={set('orderId')}
              className="w-full h-10 px-3 rounded-md bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100">
              <option value="">Select an awarded order…</option>
              {awardedOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.rz_job_id || o.id.slice(0, 8)} — {o.ghost_public_name || o.part_name || 'Order'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Payment Terms</label>
              <select value={form.paymentTerms} onChange={set('paymentTerms')}
                className="w-full h-10 px-3 rounded-md bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100">
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Net 90">Net 90</option>
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="50% Deposit">50% Deposit</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Delivery Date</label>
              <Input type="date" value={form.deliveryDate} onChange={set('deliveryDate')}
                className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Line Items</label>
              <button onClick={addLine} className="text-xs text-orange-500 hover:text-orange-400 font-bold flex items-center gap-1"><Plus size={12} /> Add Line</button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">
                <span className="col-span-5">Description</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">Unit Price</span>
                <span className="col-span-2">Total</span>
                <span className="col-span-1"></span>
              </div>
              {lineItems.map((li, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input value={li.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} placeholder="Description"
                    className="col-span-5 bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100 text-sm" />
                  <Input type="number" min="0" value={li.quantity} onChange={e => updateLineItem(idx, 'quantity', e.target.value)}
                    className="col-span-2 bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100 text-sm" />
                  <Input type="number" step="0.01" min="0" value={li.unit_price} onChange={e => updateLineItem(idx, 'unit_price', e.target.value)}
                    className="col-span-2 bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100 text-sm" />
                  <span className="col-span-2 text-sm font-semibold text-gray-700 dark:text-slate-200 text-right">
                    {((parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => removeLine(idx)} className="col-span-1 text-red-400 hover:text-red-500 justify-self-center" disabled={lineItems.length === 1}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-[#232329]">
                <span className="text-sm font-black text-gray-900 dark:text-slate-100">Total: GBP {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Additional notes or special terms…"
              className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500" />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-[#232329] flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-[#232329] text-gray-700 dark:text-slate-300">Cancel</Button>
          <Button onClick={handleCreate} disabled={loading || !form.orderId} className="bg-orange-600 hover:bg-orange-500 text-white">
            {loading ? 'Creating…' : 'Create PO (Draft)'}
          </Button>
        </div>
      </div>
    </div>
  );
}
