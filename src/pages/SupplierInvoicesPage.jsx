import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { fetchSupplierInvoices, createInvoice } from '@/services/invoiceService';
import { fetchPOsForSupplier } from '@/services/poService';
import { format } from 'date-fns';
import {
  Receipt, Search, Plus, X, DollarSign, Calendar, Clock,
  CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp,
  Trash2, FileText,
} from 'lucide-react';

const STATUS_STYLES = {
  draft:        'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300',
  submitted:    'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
  under_review: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
  approved:     'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
  rejected:     'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400',
  paid:         'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
  overdue:      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400',
};

export default function SupplierInvoicesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ poId: '', amount: '', taxAmount: '0', dueDate: '', notes: '' });
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);

  useEffect(() => { if (currentUser) loadData(); }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    const [invRes, poRes] = await Promise.all([
      fetchSupplierInvoices(currentUser.id),
      fetchPOsForSupplier(currentUser.id),
    ]);
    if (invRes.data) setInvoices(invRes.data);
    if (poRes.data) setPOs(poRes.data.filter(p => p.po_status === 'acknowledged' || p.po_status === 'issued'));
    setLoading(false);
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const updateLine = (idx, field, val) => setLineItems(p => p.map((li, i) => i === idx ? { ...li, [field]: val } : li));
  const total = lineItems.reduce((s, li) => s + (parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0), 0);

  const handleCreate = async () => {
    if (!form.amount && total === 0) {
      toast({ title: 'Validation', description: 'Amount is required.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const selectedPO = pos.find(p => p.id === form.poId);
      const items = lineItems.filter(li => li.description).map(li => ({
        description: li.description,
        quantity: parseFloat(li.quantity) || 0,
        unit_price: parseFloat(li.unit_price) || 0,
        total: (parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0),
      }));
      const { error } = await createInvoice({
        orderId: selectedPO?.order_id || null,
        poId: form.poId || null,
        supplierId: currentUser.id,
        amount: form.amount || total,
        currency: 'GBP',
        taxAmount: form.taxAmount,
        lineItems: items,
        dueDate: form.dueDate,
        notes: form.notes,
      });
      if (error) throw error;
      toast({ title: 'Invoice Submitted', description: 'Your invoice has been submitted for review.' });
      setShowCreate(false);
      setForm({ poId: '', amount: '', taxAmount: '0', dueDate: '', notes: '' });
      setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const filtered = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    return !term ||
      inv.invoice_number.toLowerCase().includes(term) ||
      (inv.po?.po_number || '').toLowerCase().includes(term) ||
      (inv.order?.rz_job_id || '').toLowerCase().includes(term);
  });

  return (
    <SupplierHubLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Finance</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">My Invoices</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Submit and track invoices against purchase orders.</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors active:scale-95 self-start sm:self-auto">
            {showCreate ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Invoice</>}
          </button>
        </div>

        {showCreate && (
          <div className="bg-white dark:bg-[#18181b] border border-orange-200 dark:border-orange-900/40 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Submit New Invoice</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Against PO</label>
                <select value={form.poId} onChange={set('poId')}
                  className="w-full h-10 px-3 rounded-md bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100">
                  <option value="">No PO (standalone)</option>
                  {pos.map(p => <option key={p.id} value={p.id}>{p.po_number} — {p.order?.part_name || 'Order'}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Due Date</label>
                <Input type="date" value={form.dueDate} onChange={set('dueDate')}
                  className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Net Amount *</label>
                <Input type="number" step="0.01" value={form.amount || total || ''} onChange={set('amount')} placeholder="0.00"
                  className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Tax / VAT</label>
                <Input type="number" step="0.01" value={form.taxAmount} onChange={set('taxAmount')} placeholder="0.00"
                  className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Line Items</label>
                <button onClick={() => setLineItems(p => [...p, { description: '', quantity: 1, unit_price: 0 }])}
                  className="text-xs text-orange-500 font-bold flex items-center gap-1"><Plus size={12} /> Add</button>
              </div>
              {lineItems.map((li, idx) => (
                <div key={idx} className="flex gap-2 mb-1.5">
                  <Input value={li.description} onChange={e => updateLine(idx, 'description', e.target.value)} placeholder="Description"
                    className="flex-1 bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100 text-sm" />
                  <Input type="number" value={li.quantity} onChange={e => updateLine(idx, 'quantity', e.target.value)} className="w-20 text-sm bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
                  <Input type="number" step="0.01" value={li.unit_price} onChange={e => updateLine(idx, 'unit_price', e.target.value)} className="w-24 text-sm bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
                  <button onClick={() => setLineItems(p => p.filter((_, i) => i !== idx))} disabled={lineItems.length === 1} className="text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Notes…"
              className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-orange-500" />
            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={creating} className="bg-orange-600 hover:bg-orange-500 text-white">
                {creating ? 'Submitting…' : 'Submit Invoice'}
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search invoice number, PO, or job ID…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading invoices…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Receipt className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No invoices found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(inv => (
              <div key={inv.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-1 self-stretch rounded-full bg-blue-500 flex-shrink-0 hidden sm:block" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">{inv.invoice_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${STATUS_STYLES[inv.invoice_status] || STATUS_STYLES.submitted}`}>
                      {inv.invoice_status.replace('_', ' ').toUpperCase()}
                    </span>
                    {inv.po?.po_number && <span className="text-xs text-gray-400">{inv.po.po_number}</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-gray-800 dark:text-slate-200">
                      <DollarSign size={11} /> {inv.currency} {Number(inv.total_amount).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(inv.submitted_at), 'dd MMM yyyy')}</span>
                    {inv.due_date && <span className="flex items-center gap-1"><Clock size={11} /> Due {inv.due_date}</span>}
                  </div>
                </div>
                {inv.invoice_status === 'paid' && (
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SupplierHubLayout>
  );
}
