import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { fetchPOsForSupplier, acknowledgePO } from '@/services/poService';
import { createNotification } from '@/lib/createNotification';
import { format } from 'date-fns';
import {
  FileText, Search, Package, DollarSign, Calendar,
  CheckCircle2, Clock, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';

export default function SupplierPurchaseOrdersPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPO, setExpandedPO] = useState(null);

  useEffect(() => { if (currentUser) loadPOs(); }, [currentUser]);

  const loadPOs = async () => {
    setLoading(true);
    const { data } = await fetchPOsForSupplier(currentUser.id);
    if (data) setPOs(data);
    setLoading(false);
  };

  const handleAcknowledge = async (po) => {
    try {
      const { error } = await acknowledgePO(po.id, currentUser.id);
      if (error) throw error;
      toast({ title: 'PO Acknowledged', description: `You have acknowledged ${po.po_number}.` });
      loadPOs();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = pos.filter(po => {
    const term = searchTerm.toLowerCase();
    return !term ||
      po.po_number.toLowerCase().includes(term) ||
      (po.order?.rz_job_id || '').toLowerCase().includes(term) ||
      (po.order?.part_name || '').toLowerCase().includes(term);
  });

  const statusStyles = {
    draft:        'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300',
    issued:       'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    acknowledged: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    completed:    'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <SupplierHubLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Procurement</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Purchase Orders</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">View and acknowledge purchase orders.</p>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input placeholder="Search PO number or job ID…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading purchase orders…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No purchase orders found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(po => (
              <div key={po.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-1 self-stretch rounded-full bg-blue-500 flex-shrink-0 hidden sm:block" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">{po.po_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${statusStyles[po.po_status] || statusStyles.draft}`}>
                        {po.po_status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{po.order?.ghost_public_name || po.order?.part_name || 'Order'}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-gray-800 dark:text-slate-200">
                        <DollarSign size={11} /> {po.currency} {Number(po.total_amount).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(po.created_at), 'dd MMM yyyy')}</span>
                      {po.delivery_date && <span className="flex items-center gap-1"><Clock size={11} /> Due {po.delivery_date}</span>}
                      {po.payment_terms && <span>{po.payment_terms}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {po.po_status === 'issued' && (
                      <Button onClick={() => handleAcknowledge(po)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold">
                        <CheckCircle2 size={14} className="mr-1" /> Acknowledge
                      </Button>
                    )}
                    <button onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                      {expandedPO === po.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {expandedPO === po.id && (
                  <div className="border-t border-gray-100 dark:border-[#232329] p-4 sm:p-5 bg-gray-50/50 dark:bg-[#131316]">
                    {po.line_items?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-2">Line Items</p>
                        <table className="w-full text-sm">
                          <thead className="text-xs text-gray-400 dark:text-slate-500">
                            <tr><th className="text-left pb-2">Item</th><th className="text-right pb-2">Qty</th><th className="text-right pb-2">Unit</th><th className="text-right pb-2">Total</th></tr>
                          </thead>
                          <tbody className="text-gray-700 dark:text-slate-300">
                            {po.line_items.map((li, i) => (
                              <tr key={i} className="border-t border-gray-100 dark:border-[#232329]">
                                <td className="py-1.5">{li.description}</td>
                                <td className="text-right py-1.5">{li.quantity}</td>
                                <td className="text-right py-1.5">{po.currency} {Number(li.unit_price).toLocaleString()}</td>
                                <td className="text-right py-1.5 font-semibold">{po.currency} {Number(li.total).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {po.notes && (
                      <div>
                        <p className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Notes</p>
                        <p className="text-sm text-gray-700 dark:text-slate-300">{po.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SupplierHubLayout>
  );
}
