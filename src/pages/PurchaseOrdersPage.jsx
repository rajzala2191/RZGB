import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import CreatePOModal from '@/components/CreatePOModal';
import { fetchAllPurchaseOrders, issuePO, updatePOStatus } from '@/services/poService';
import { createNotification } from '@/lib/createNotification';
import { createAuditLog } from '@/lib/auditLogger';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText, Search, Package, DollarSign, Building2, Calendar,
  CheckCircle2, Clock, Send, Download, Plus, Eye,
} from 'lucide-react';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { loadPOs(); }, []);

  const loadPOs = async () => {
    setLoading(true);
    const { data } = await fetchAllPurchaseOrders();
    if (data) setPOs(data);
    setLoading(false);
  };

  const handleIssue = async (po) => {
    try {
      const { error } = await issuePO(po.id);
      if (error) throw error;

      await createNotification({
        recipientId: po.supplier_id,
        senderId: currentUser?.id,
        type: 'PO_ISSUED',
        title: 'Purchase Order Issued',
        message: `PO ${po.po_number} for ${po.order?.ghost_public_name || po.order?.part_name || 'order'} has been issued. Please acknowledge.`,
        link: '/supplier-hub/purchase-orders',
      });

      await createAuditLog({
        userId: currentUser?.id,
        action: 'PO_ISSUED',
        orderId: po.order_id,
        details: `Issued PO ${po.po_number} to ${po.supplier?.company_name}. Total: ${po.currency} ${po.total_amount}`,
        status: 'success',
      });

      toast({ title: 'PO Issued', description: `${po.po_number} sent to ${po.supplier?.company_name}.` });
      loadPOs();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const exportPDF = (po) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Purchase Order', 14, 22);
    doc.setFontSize(10);
    doc.text(`PO Number: ${po.po_number}`, 14, 32);
    doc.text(`Date: ${format(new Date(po.created_at), 'dd MMM yyyy')}`, 14, 38);
    doc.text(`Supplier: ${po.supplier?.company_name || 'N/A'}`, 14, 44);
    doc.text(`Order: ${po.order?.rz_job_id || po.order?.part_name || 'N/A'}`, 14, 50);
    if (po.payment_terms) doc.text(`Payment Terms: ${po.payment_terms}`, 14, 56);
    if (po.delivery_date) doc.text(`Delivery Date: ${po.delivery_date}`, 14, 62);

    const lineItems = po.line_items || [];
    if (lineItems.length > 0) {
      autoTable(doc, {
        startY: 70,
        head: [['Item', 'Qty', 'Unit Price', 'Total']],
        body: lineItems.map(li => [li.description || '', li.quantity || '', `${po.currency} ${li.unit_price || 0}`, `${po.currency} ${li.total || 0}`]),
        foot: [['', '', 'Total', `${po.currency} ${Number(po.total_amount).toLocaleString()}`]],
      });
    } else {
      doc.text(`Total Amount: ${po.currency} ${Number(po.total_amount).toLocaleString()}`, 14, 70);
    }

    if (po.notes) {
      const finalY = doc.lastAutoTable?.finalY || 80;
      doc.text(`Notes: ${po.notes}`, 14, finalY + 10);
    }

    doc.save(`${po.po_number}.pdf`);
  };

  const filtered = pos.filter(po => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      po.po_number.toLowerCase().includes(term) ||
      (po.order?.rz_job_id || '').toLowerCase().includes(term) ||
      (po.supplier?.company_name || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' || po.po_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusStyles = {
    draft:        'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300',
    issued:       'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    acknowledged: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    amended:      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
    completed:    'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    cancelled:    'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400',
  };

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Procurement</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Purchase Orders</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Create, issue, and track purchase orders.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors active:scale-95 self-start sm:self-auto">
            <Plus size={14} /> Create PO
          </button>
        </div>

        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search PO number, job ID, supplier…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-orange-500">
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
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
              <div key={po.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-orange-300 dark:hover:border-orange-800 transition-colors">
                <div className="w-1 self-stretch rounded-full bg-blue-500 flex-shrink-0 hidden sm:block" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">{po.po_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${statusStyles[po.po_status] || statusStyles.draft}`}>
                      {po.po_status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Building2 size={12} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{po.supplier?.company_name || 'Supplier'}</span>
                    {po.order?.rz_job_id && <span className="text-xs text-gray-500 dark:text-slate-400">• {po.order.rz_job_id}</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-gray-800 dark:text-slate-200">
                      <DollarSign size={11} /> {po.currency} {Number(po.total_amount).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(po.created_at), 'dd MMM yyyy')}</span>
                    {po.delivery_date && <span className="flex items-center gap-1"><Clock size={11} /> Due {po.delivery_date}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {po.po_status === 'draft' && (
                    <Button onClick={() => handleIssue(po)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold">
                      <Send size={14} className="mr-1" /> Issue
                    </Button>
                  )}
                  <button onClick={() => exportPDF(po)} className="p-2 rounded-lg border border-gray-200 dark:border-[#232329] text-gray-500 dark:text-slate-400 hover:text-orange-500 hover:border-orange-300 transition-colors">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreatePOModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => { loadPOs(); setShowCreateModal(false); }} />
    </ControlCentreLayout>
  );
}
