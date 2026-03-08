import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import OrderTimeline from '@/components/OrderTimeline';
import { format } from 'date-fns';
import {
  Loader2, ArrowLeft, FileText, MapPin, PoundSterling,
  Upload, Users, User, Building2,
  Inbox, Trash2, Download, Package, Layers, Hash,
  Ruler, Paintbrush, Calendar, AlertTriangle, X,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────
const RECIPIENT_TYPES = {
  client:   'admin_to_client',
  supplier: 'admin_document',
};

const DOC_GROUPS = [
  { key: 'admin_to_client',    label: 'Sent to Client',   color: 'text-sky-500',     bg: 'bg-sky-50 dark:bg-sky-950/20',      icon: User },
  { key: 'admin_document',     label: 'Sent to Supplier', color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/20', icon: Building2 },
  { key: 'client_drawing',     label: 'From Client',      color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/20', icon: FileText },
  { key: '3d_model',           label: 'From Client (3D)', color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/20', icon: FileText },
  { key: 'supplier_submission',label: 'From Supplier',    color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: Building2 },
];

const STATUS_HEX = {
  PENDING_ADMIN_SCRUB: { hex: '#3b82f6', label: 'Pending Review' },
  SANITIZED:           { hex: '#a855f7', label: 'Sanitized' },
  OPEN_FOR_BIDDING:    { hex: '#f59e0b', label: 'Open for Bidding' },
  BID_RECEIVED:        { hex: '#f97316', label: 'Bid Received' },
  AWARDED:             { hex: '#f59e0b', label: 'Awarded' },
  MATERIAL:            { hex: '#0ea5e9', label: 'Material Sourcing' },
  CASTING:             { hex: '#f97316', label: 'Casting' },
  MACHINING:           { hex: '#8b5cf6', label: 'Machining' },
  QC:                  { hex: '#22c55e', label: 'Quality Control' },
  DISPATCH:            { hex: '#06b6d4', label: 'Dispatch' },
  DELIVERED:           { hex: '#22c55e', label: 'Delivered' },
  WITHDRAWN:           { hex: '#ef4444', label: 'Withdrawn' },
};

// ── File helpers ───────────────────────────────────────────────────────────
function getDocFileType(name = '') {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'pdf';
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].some(e => n.endsWith(e))) return 'image';
  if (['.stl', '.obj', '.gltf', '.glb'].some(e => n.endsWith(e))) return 'model';
  return 'file';
}
function getDocExt(name = '') {
  const m = name?.match(/\.([^.]+)$/);
  return m ? m[1].toUpperCase() : '—';
}

const RECIPIENT_META = {
  admin_to_client:     { label: 'To Client',        cls: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/40' },
  admin_document:      { label: 'To Supplier',      cls: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/40' },
  client_drawing:      { label: 'From Client',      cls: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/40' },
  '3d_model':          { label: 'From Client (3D)', cls: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/40' },
  supplier_submission: { label: 'From Supplier',    cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40' },
};

// ── Spec field component ───────────────────────────────────────────────────
const SpecField = ({ label, value, icon: Icon, mono = false, full = false }) => (
  <div className={full ? 'col-span-2 sm:col-span-3' : ''}>
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1">
      {Icon && <Icon size={10} />} {label}
    </p>
    <p className={`text-sm font-semibold text-gray-800 dark:text-slate-200 ${mono ? 'font-mono' : ''}`}>
      {value || <span className="text-gray-400 dark:text-slate-600 font-normal italic">Not specified</span>}
    </p>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminOrderPreviewPage() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const { currentUser } = useAuth();
  const { toast }   = useToast();

  const [order,            setOrder]            = useState(null);
  const [updates,          setUpdates]          = useState([]);
  const [documents,        setDocuments]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [showDeleteConfirm,setShowDeleteConfirm]= useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [exporting,        setExporting]        = useState(false);
  const [exportUrl,        setExportUrl]        = useState(null);
  const [uploading,        setUploading]        = useState(false);
  const [uploadRecipient,  setUploadRecipient]  = useState('client');
  const [signedUrls,       setSignedUrls]       = useState({});
  const [previewDoc,       setPreviewDoc]       = useState(null);
  const [previewBlob,      setPreviewBlob]      = useState(null);
  const [loadingPreview,   setLoadingPreview]   = useState(false);
  const previewBlobRef = useRef(null);

  // ── Data fetching ──────────────────────────────────────────────────────
  const fetchSignedUrls = async (docs) => {
    if (!docs?.length) return;
    const pairs = await Promise.all(
      docs.map(async (doc) => {
        const { data } = await supabaseAdmin.storage
          .from('documents').createSignedUrl(doc.file_path, 3600);
        return [doc.id, data?.signedUrl ?? null];
      })
    );
    setSignedUrls(Object.fromEntries(pairs));
  };

  const fetchDocs = async () => {
    const { data } = await supabaseAdmin.from('documents')
      .select('*').eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (data) { setDocuments(data); fetchSignedUrls(data); }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*, client:client_id(company_name, email), supplier:supplier_id(company_name, email)')
          .eq('id', orderId).maybeSingle();
        if (error) throw error;
        setOrder(data);
        if (data?.rz_job_id) {
          const { data: upd } = await supabaseAdmin
            .from('job_updates').select('*')
            .eq('rz_job_id', data.rz_job_id)
            .order('created_at', { ascending: true });
          if (upd) setUpdates(upd);
        }
        const { data: docs } = await supabaseAdmin
          .from('documents').select('*').eq('order_id', orderId)
          .order('created_at', { ascending: false });
        if (docs) { setDocuments(docs); fetchSignedUrls(docs); }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // ── Actions ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip   = new JSZip();
      zip.file('order-details.json', JSON.stringify(order, null, 2));
      const blob = await zip.generateAsync({ type: 'blob' });
      setExportUrl(URL.createObjectURL(blob));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteOrder = async () => {
    setDeleting(true);
    try {
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      navigate('/control-centre/live-tracking');
    } catch {
      setDeleting(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;
    setUploading(true);
    try {
      const ext     = file.name.split('.').pop();
      const base    = `admin-docs/${order.id}-${Date.now()}`;
      const inserts = uploadRecipient === 'both'
        ? [RECIPIENT_TYPES.client, RECIPIENT_TYPES.supplier]
        : [RECIPIENT_TYPES[uploadRecipient]];

      for (const fileType of inserts) {
        const storagePath = `${base}-${fileType}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage
          .from('documents').upload(storagePath, file, { upsert: false });
        if (upErr) throw upErr;
        await supabaseAdmin.from('documents').insert({
          order_id: order.id, client_id: order.client_id || null,
          supplier_id: order.supplier_id || null, file_name: file.name,
          file_path: storagePath, uploaded_by: currentUser.id,
          file_type: fileType, status: 'approved',
        });
      }
      const dest = uploadRecipient === 'both' ? 'Client & Supplier'
                 : uploadRecipient === 'client' ? 'Client' : 'Supplier';
      toast({ title: 'Document Sent', description: `${file.name} delivered to ${dest}.` });
      fetchDocs();
    } catch (err) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ── Preview blob fetch (PDF only) ──────────────────────────────────────
  useEffect(() => {
    if (previewBlobRef.current) { URL.revokeObjectURL(previewBlobRef.current); previewBlobRef.current = null; }
    setPreviewBlob(null);
    if (!previewDoc) return;
    const url = signedUrls[previewDoc.id];
    if (getDocFileType(previewDoc.file_name) !== 'pdf' || !url) return;
    let cancelled = false;
    setLoadingPreview(true);
    fetch(url)
      .then(r => r.blob())
      .then(b => {
        if (cancelled) return;
        const u = URL.createObjectURL(new Blob([b], { type: 'application/pdf' }));
        previewBlobRef.current = u;
        setPreviewBlob(u);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingPreview(false); });
    return () => { cancelled = true; };
  }, [previewDoc, signedUrls]);

  // ── Loading / error ────────────────────────────────────────────────────
  if (loading) return (
    <ControlCentreLayout>
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
      </div>
    </ControlCentreLayout>
  );

  if (!order) return (
    <ControlCentreLayout>
      <div className="max-w-lg mx-auto py-20 text-center">
        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <p className="text-gray-500 dark:text-slate-400">Order not found.</p>
        <button onClick={() => navigate(-1)}
          className="mt-6 px-5 py-2 rounded-xl bg-gray-100 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#2e2e35] transition-colors">
          Go Back
        </button>
      </div>
    </ControlCentreLayout>
  );

  const status    = order.order_status || 'PENDING_ADMIN_SCRUB';
  const statusCfg = STATUS_HEX[status] || { hex: '#f97316', label: status.replace(/_/g, ' ') };

  return (
    <ControlCentreLayout>

      {/* ── Delete confirmation modal ──────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Delete Order</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  This will permanently delete <span className="font-semibold text-gray-800 dark:text-slate-200">{order.part_name || 'this order'}</span> and all associated data. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#2e2e35] transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDeleteOrder} disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60 flex items-center gap-2">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'Deleting…' : 'Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document preview lightbox ──────────────────────────────────── */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl overflow-hidden w-full max-w-5xl flex flex-col shadow-2xl"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-[#232329] border-b border-gray-200 dark:border-[#232329] flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{previewDoc.file_name}</span>
                {RECIPIENT_META[previewDoc.file_type] && (
                  <span className={`hidden sm:inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full border ${RECIPIENT_META[previewDoc.file_type].cls}`}>
                    {RECIPIENT_META[previewDoc.file_type].label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {signedUrls[previewDoc.id] && (
                  <a
                    href={signedUrls[previewDoc.id]}
                    download={previewDoc.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                  >
                    <Download size={12} /> Download
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2e2e35] hover:bg-gray-200 dark:hover:bg-[#3a3a42] transition-colors text-gray-500 dark:text-slate-400"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            {/* Viewer */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 dark:bg-[#09090b]" style={{ minHeight: 420 }}>
              {(() => {
                const ft  = getDocFileType(previewDoc.file_name);
                const url = signedUrls[previewDoc.id];
                if (ft === 'pdf') {
                  if (loadingPreview) return (
                    <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-slate-500 py-16">
                      <Loader2 size={30} className="animate-spin text-orange-500" />
                      <span className="text-sm">Loading PDF…</span>
                    </div>
                  );
                  if (previewBlob) return (
                    <iframe key={previewBlob} src={previewBlob} title={previewDoc.file_name} className="border-none" style={{ width: '100%', height: '80vh' }} />
                  );
                  return (
                    <div className="text-center p-10">
                      <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Could not load PDF preview.</p>
                      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition-colors">Open in New Tab</a>}
                    </div>
                  );
                }
                if (ft === 'image') return (
                  <div className="flex items-center justify-center w-full h-full p-6">
                    <img
                      src={url}
                      alt={previewDoc.file_name}
                      className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl"
                      onContextMenu={e => e.preventDefault()}
                    />
                  </div>
                );
                return (
                  <div className="text-center p-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] flex items-center justify-center mx-auto mb-4">
                      <FileText size={28} className="text-gray-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">{getDocExt(previewDoc.file_name)} File</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">This file type cannot be previewed in the browser.</p>
                    {url && (
                      <a href={url} download={previewDoc.file_name} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition-colors">
                        <Download size={14} /> Download File
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-5 pb-10">

        {/* ── Back ──────────────────────────────────────────────────────── */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100 transition-colors font-medium">
          <ArrowLeft size={15} /> Back
        </button>

        {/* ── Hero header ───────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">

            {/* Left: title */}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-1">Order Preview</p>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100 leading-tight truncate">
                {order.part_name || 'Unnamed Order'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {order.rz_job_id && (
                  <span className="font-mono text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2.5 py-1 rounded-lg">
                    {order.rz_job_id}
                  </span>
                )}
                <span className="font-mono text-xs text-gray-400 dark:text-slate-500">
                  ID: {order.id.slice(0, 8).toUpperCase()}
                </span>
                {order.created_at && (
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                    <Calendar size={11} />
                    {format(new Date(order.created_at), 'dd MMM yyyy')}
                  </span>
                )}
              </div>
            </div>

            {/* Right: status + actions */}
            <div className="flex flex-col items-start sm:items-end gap-2 sm:flex-shrink-0">
              {/* Status badge */}
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border"
                style={{ background: `${statusCfg.hex}12`, color: statusCfg.hex, borderColor: `${statusCfg.hex}30` }}
              >
                {statusCfg.label}
              </span>
              {/* Export */}
              {exportUrl ? (
                <a href={exportUrl} download={`order-${order.id.slice(0, 8)}.zip`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                  <Download size={13} /> Download
                </a>
              ) : (
                <button onClick={handleExport} disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#2e2e35] transition-colors disabled:opacity-50">
                  {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  Export
                </button>
              )}
              {/* Delete */}
              <button onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          {/* ── Parties strip ────────────────────────────────────────── */}
          {(order.client || order.supplier) && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#232329] flex flex-wrap gap-4">
              {order.client && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40 flex items-center justify-center flex-shrink-0">
                    <User size={13} className="text-sky-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Client</p>
                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-tight">{order.client.company_name}</p>
                    {order.client.email && <p className="text-[10px] text-gray-400 dark:text-slate-500">{order.client.email}</p>}
                  </div>
                </div>
              )}
              {order.supplier && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/40 flex items-center justify-center flex-shrink-0">
                    <Building2 size={13} className="text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Supplier</p>
                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-tight">{order.supplier.company_name}</p>
                    {order.supplier.email && <p className="text-[10px] text-gray-400 dark:text-slate-500">{order.supplier.email}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Quick-info strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Layers,   label: 'Material',        value: order.material || '—' },
            { icon: Hash,     label: 'Quantity',         value: order.quantity ? `${order.quantity} units` : '—' },
            { icon: MapPin,   label: 'Delivery',         value: order.delivery_location || 'TBD' },
            { icon: Calendar, label: 'Lead Time',        value: order.delivery_days ? `${order.delivery_days} days` : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} className="text-orange-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">{label}</p>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Main grid: left content | right sidebar ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left column (2/3) ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Order Specifications */}
            <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 dark:bg-[#232329] border-b border-gray-200 dark:border-[#232329]">
                <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Order Specifications</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                  <SpecField icon={Layers}     label="Material"       value={order.material} />
                  <SpecField icon={Hash}       label="Quantity"       value={order.quantity} />
                  <SpecField icon={Ruler}      label="Tolerance"      value={order.tolerance || 'Standard'} />
                  <SpecField icon={Paintbrush} label="Surface Finish" value={order.surface_finish || 'As Machined'} />
                  {order.buy_price && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                        <PoundSterling size={10} /> Price / Part
                      </p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        £{parseFloat(order.buy_price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  <SpecField icon={MapPin}     label="Delivery Location" value={order.delivery_location} />
                </div>

                {/* Description + Special Reqs */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-2">Description</p>
                    <div className="bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] rounded-xl p-3 min-h-[72px] text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                      {order.description || <span className="italic text-gray-400 dark:text-slate-600">No description provided.</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-2">Special Requirements</p>
                    <div className="bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] rounded-xl p-3 min-h-[72px] text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                      {order.special_requirements || <span className="italic text-gray-400 dark:text-slate-600">None specified.</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents & Files */}
            <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 bg-gray-50 dark:bg-[#232329] border-b border-gray-200 dark:border-[#232329] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Documents & Files</h2>
                  {documents.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-[#2e2e35] text-gray-500 dark:text-slate-400">
                      {documents.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Upload bar */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-[#232329] flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Users size={13} className="text-gray-400 dark:text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">Send to</span>
                  <select
                    value={uploadRecipient}
                    onChange={e => setUploadRecipient(e.target.value)}
                    className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#2e2e35] rounded-lg px-2.5 py-1.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="client">Client</option>
                    <option value="supplier">Supplier</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  uploading
                    ? 'bg-gray-100 dark:bg-[#232329] text-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-500 text-white'
                }`}>
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploading ? 'Uploading…' : 'Upload & Send'}
                  <input type="file" className="hidden" disabled={uploading}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.step,.stp,.dxf,.dwg"
                    onChange={handleUpload} />
                </label>
                <p className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block">
                  Delivered instantly to selected portal
                </p>
              </div>

              {/* Visual document card grid */}
              {documents.length === 0 ? (
                <div className="py-14 text-center">
                  <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">No documents yet</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Upload files above to share with client or supplier</p>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {documents.map(doc => {
                    const ft    = getDocFileType(doc.file_name);
                    const url   = signedUrls[doc.id];
                    const recip = RECIPIENT_META[doc.file_type] || { label: doc.file_type, cls: 'bg-gray-100 dark:bg-[#232329] text-gray-500 dark:text-slate-400 border-gray-200 dark:border-[#2e2e35]' };
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setPreviewDoc(doc)}
                        className="group text-left bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] rounded-xl overflow-hidden hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-lg transition-all duration-150 focus:outline-none"
                      >
                        {/* Preview thumbnail area */}
                        <div className="relative h-28 flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-[#1a1a1f]">
                          {ft === 'image' && url ? (
                            <img
                              src={url}
                              alt={doc.file_name}
                              className="w-full h-full object-cover"
                              onContextMenu={e => e.preventDefault()}
                            />
                          ) : ft === 'pdf' ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center">
                                <FileText size={20} className="text-red-500" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-red-500">PDF</span>
                            </div>
                          ) : ft === 'model' ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-center justify-center">
                                <Package size={20} className="text-orange-500" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">3D MODEL</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-[#2e2e35] border border-gray-300 dark:border-[#3a3a42] flex items-center justify-center">
                                <FileText size={20} className="text-gray-500 dark:text-slate-400" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">{getDocExt(doc.file_name)}</span>
                            </div>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-all duration-150 opacity-0 group-hover:opacity-100">
                            <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-[#18181b]/90 text-xs font-bold text-gray-800 dark:text-slate-200 shadow-lg">
                              View
                            </span>
                          </div>
                        </div>
                        {/* File info */}
                        <div className="px-3 py-2.5">
                          <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate leading-tight mb-2">{doc.file_name}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-200 dark:bg-[#2e2e35] text-gray-500 dark:text-slate-400">
                              {getDocExt(doc.file_name)}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${recip.cls}`}>
                              {recip.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar (1/3) ───────────────────────────────────── */}
          <div className="space-y-5">

            {/* Order timeline */}
            <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 dark:bg-[#232329] border-b border-gray-200 dark:border-[#232329]">
                <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Order Timeline</h2>
              </div>
              <div className="p-5">
                <OrderTimeline
                  currentStatus={status}
                  createdAt={order.created_at}
                  updatedAt={order.updated_at}
                  updates={updates}
                  selectedProcesses={order.selected_processes}
                />
              </div>
            </div>

            {/* Latest job updates */}
            {updates.length > 0 && (
              <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 dark:bg-[#232329] border-b border-gray-200 dark:border-[#232329]">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Recent Activity</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-[#232329] max-h-72 overflow-y-auto">
                  {[...updates].reverse().slice(0, 8).map((u, idx) => (
                    <div key={idx} className="px-5 py-3 flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                          {u.stage?.replace(/_/g, ' ')}
                          {u.status && <span className="text-gray-400 dark:text-slate-500 font-normal"> · {u.status.replace(/_/g, ' ')}</span>}
                        </p>
                        {u.notes && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{u.notes}</p>}
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-mono">
                          {format(new Date(u.created_at), 'dd MMM, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </ControlCentreLayout>
  );
}
