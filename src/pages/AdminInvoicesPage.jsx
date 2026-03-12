import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { fetchAllInvoices, updateInvoiceStatus, fetchInvoiceStats } from '@/services/invoiceService';
import { createNotification } from '@/lib/createNotification';
import { createAuditLog } from '@/lib/auditLogger';
import { format, differenceInDays } from 'date-fns';
import {
  Receipt, Search, DollarSign, Building2, Calendar, Clock,
  CheckCircle2, XCircle, Eye, AlertTriangle, TrendingUp,
  ChevronDown, ChevronUp,
} from 'lucide-react';

const STATUS_STYLES = {
  submitted:    'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
  under_review: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
  approved:     'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
  rejected:     'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400',
  paid:         'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
  overdue:      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400',
};

export default function AdminInvoicesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [invRes, statsRes] = await Promise.all([fetchAllInvoices(), fetchInvoiceStats()]);
    if (invRes.data) setInvoices(invRes.data);
    setStats(statsRes);
    setLoading(false);
  };

  const handleStatusChange = async (inv, newStatus) => {
    try {
      const { error } = await updateInvoiceStatus(inv.id, newStatus, currentUser?.id);
      if (error) throw error;

      await createAuditLog({
        userId: currentUser?.id,
        action: `INVOICE_${newStatus.toUpperCase()}`,
        orderId: inv.order_id,
        details: `Invoice ${inv.invoice_number} marked as ${newStatus}`,
        status: 'success',
      });

      await createNotification({
        recipientId: inv.supplier_id,
        senderId: currentUser?.id,
        type: `INVOICE_${newStatus.toUpperCase()}`,
        title: `Invoice ${newStatus === 'approved' ? 'Approved' : newStatus === 'paid' ? 'Paid' : newStatus === 'rejected' ? 'Rejected' : 'Updated'}`,
        message: `Invoice ${inv.invoice_number} has been ${newStatus}.`,
        link: '/supplier-hub/invoices',
      });

      toast({ title: 'Updated', description: `Invoice ${inv.invoice_number} → ${newStatus}` });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      inv.invoice_number.toLowerCase().includes(term) ||
      (inv.supplier?.company_name || '').toLowerCase().includes(term) ||
      (inv.po?.po_number || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' || inv.invoice_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isOverdue = (inv) => inv.due_date && new Date(inv.due_date) < new Date() && !['paid', 'cancelled'].includes(inv.invoice_status);

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Finance</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Invoice Management</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Review, approve, and track supplier invoices.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Invoices', value: stats.total || 0, icon: Receipt, color: 'text-blue-500' },
            { label: 'Pending Review', value: stats.submitted || 0, icon: Clock, color: 'text-amber-500' },
            { label: 'Total Value', value: `£${((stats.totalValue || 0) / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-orange-500' },
            { label: 'Paid', value: `£${((stats.paidValue || 0) / 1000).toFixed(1)}k`, icon: CheckCircle2, color: 'text-emerald-500' },
          ].map((m, i) => (
            <div key={i} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">{m.label}</span>
                <m.icon size={16} className={m.color} />
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-slate-100">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search invoice, supplier, PO…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100">
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Receipt className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No invoices found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(inv => (
              <div key={inv.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 hidden sm:block ${isOverdue(inv) ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">{inv.invoice_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${STATUS_STYLES[inv.invoice_status]}`}>{inv.invoice_status.replace('_', ' ').toUpperCase()}</span>
                      {isOverdue(inv) && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle size={10} /> {differenceInDays(new Date(), new Date(inv.due_date))}d overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 size={12} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{inv.supplier?.company_name}</span>
                      {inv.order?.rz_job_id && <span className="text-xs text-gray-400">• {inv.order.rz_job_id}</span>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-gray-800 dark:text-slate-200"><DollarSign size={11} /> {inv.currency} {Number(inv.total_amount).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(inv.submitted_at), 'dd MMM yyyy')}</span>
                      {inv.due_date && <span className="flex items-center gap-1"><Clock size={11} /> Due {inv.due_date}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {inv.invoice_status === 'submitted' && (
                      <>
                        <Button onClick={() => handleStatusChange(inv, 'approved')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"><CheckCircle2 size={14} className="mr-1" /> Approve</Button>
                        <Button onClick={() => handleStatusChange(inv, 'rejected')} variant="outline" className="border-red-300 text-red-500 hover:bg-red-50 text-xs"><XCircle size={14} className="mr-1" /> Reject</Button>
                      </>
                    )}
                    {inv.invoice_status === 'approved' && (
                      <Button onClick={() => handleStatusChange(inv, 'paid')} className="bg-blue-600 hover:bg-blue-500 text-white text-xs"><DollarSign size={14} className="mr-1" /> Mark Paid</Button>
                    )}
                    <button onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)} className="text-gray-400 hover:text-gray-600">
                      {expandedId === inv.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
                {expandedId === inv.id && (
                  <div className="border-t border-gray-100 dark:border-[#232329] p-4 bg-gray-50/50 dark:bg-[#131316]">
                    {inv.line_items?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-500 mb-1">Line Items</p>
                        {inv.line_items.map((li, i) => (
                          <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-slate-400">
                            <span>{li.description} (x{li.quantity})</span>
                            <span className="font-semibold">{inv.currency} {Number(li.total || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t border-gray-200 dark:border-[#232329] pt-2">
                      <span className="text-gray-500">Subtotal / Tax / Total</span>
                      <span className="font-bold text-gray-800 dark:text-slate-200">{inv.currency} {Number(inv.amount).toLocaleString()} + {Number(inv.tax_amount).toLocaleString()} = {Number(inv.total_amount).toLocaleString()}</span>
                    </div>
                    {inv.notes && <p className="text-sm text-gray-500 mt-2">{inv.notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
}
