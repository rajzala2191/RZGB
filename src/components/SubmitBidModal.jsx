import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { submitBid } from '@/services/bidService';
import { createNotification } from '@/lib/createNotification';
import { X, Gavel, Layers, Hash, Plus, Trash2 } from 'lucide-react';
import SupplierRFQQandA from '@/components/SupplierRFQQandA';

export default function SubmitBidModal({ isOpen, onClose, order, onSuccess }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    currency: 'GBP',
    leadTimeDays: '',
    notes: '',
  });
  const [breakdownItems, setBreakdownItems] = useState([]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const addBreakdownItem = () => setBreakdownItems(prev => [...prev, { label: '', amount: '' }]);
  const updateBreakdownItem = (idx, field, val) =>
    setBreakdownItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  const removeBreakdownItem = (idx) => setBreakdownItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!form.amount || !form.leadTimeDays) {
      toast({ title: 'Validation', description: 'Amount and lead time are required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const breakdown = breakdownItems.reduce((acc, item) => {
        if (item.label) acc[item.label] = parseFloat(item.amount) || 0;
        return acc;
      }, {});

      const { data, error } = await submitBid({
        orderId: order.id,
        supplierId: currentUser.id,
        amount: parseFloat(form.amount),
        currency: form.currency,
        leadTimeDays: parseInt(form.leadTimeDays),
        notes: form.notes,
        priceBreakdown: breakdown,
      });

      if (error) throw error;

      toast({ title: 'Bid Submitted', description: `Your bid of ${form.currency} ${Number(form.amount).toLocaleString()} has been submitted.` });

      setForm({ amount: '', currency: 'GBP', leadTimeDays: '', notes: '' });
      setBreakdownItems([]);
      onSuccess();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to submit bid.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-[#232329]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Gavel size={18} className="text-orange-500" /> Submit Bid
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="bg-gray-50 dark:bg-[#232329] p-4 rounded-lg border border-gray-200 dark:border-[#2e2e35] space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Order:</span> <span className="font-mono text-gray-700 dark:text-slate-200">{order?.rz_job_id || order?.id?.slice(0, 8)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Part:</span> <span className="font-semibold text-orange-500">{order?.ghost_public_name || order?.part_name}</span></div>
            {order?.material && <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Material:</span> <span className="text-gray-700 dark:text-slate-200">{order.material}</span></div>}
            {order?.quantity && <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Quantity:</span> <span className="text-gray-700 dark:text-slate-200">{order.quantity}</span></div>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Bid Amount *</label>
              <Input type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} placeholder="e.g. 7500"
                className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Currency</label>
              <select value={form.currency} onChange={set('currency')}
                className="w-full h-10 px-3 rounded-md bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100">
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Lead Time (days) *</label>
            <Input type="number" min="1" value={form.leadTimeDays} onChange={set('leadTimeDays')} placeholder="e.g. 14"
              className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Price Breakdown</label>
              <button onClick={addBreakdownItem} className="text-xs text-orange-500 hover:text-orange-400 font-bold flex items-center gap-1">
                <Plus size={12} /> Add Line
              </button>
            </div>
            {breakdownItems.length > 0 && (
              <div className="space-y-2">
                {breakdownItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input value={item.label} onChange={e => updateBreakdownItem(idx, 'label', e.target.value)} placeholder="e.g. Materials"
                      className="flex-1 bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100 text-sm" />
                    <Input type="number" step="0.01" value={item.amount} onChange={e => updateBreakdownItem(idx, 'amount', e.target.value)} placeholder="0.00"
                      className="w-28 bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100 text-sm" />
                    <button onClick={() => removeBreakdownItem(idx)} className="text-red-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Capabilities, certifications, special terms…"
              className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500" />
          </div>

          <div className="border-t border-gray-200 dark:border-[#232329] pt-4">
            <SupplierRFQQandA orderId={order?.id} />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-[#232329] flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-[#232329] text-gray-700 dark:text-slate-300">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.amount || !form.leadTimeDays} className="bg-orange-600 hover:bg-orange-500 text-white">
            {loading ? 'Submitting…' : 'Submit Bid'}
          </Button>
        </div>
      </div>
    </div>
  );
}
