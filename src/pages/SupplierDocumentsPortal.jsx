import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, FileImage, FolderOpen, Eye, Download,
  Search, AlertCircle, X, File, ChevronDown, Package,
} from 'lucide-react';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { DocumentPreviewModal } from '@/components/DocumentPreview';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

/* ── helpers ──────────────────────────────────────────────── */
function fileIcon(type, name) {
  const t = (type || name || '').toLowerCase();
  if (t.includes('pdf'))   return <FileText size={16} style={{ color: '#ef4444' }} />;
  if (t.includes('image') || t.includes('png') || t.includes('jpg')) return <FileImage size={16} style={{ color: '#f97316' }} />;
  return <File size={16} style={{ color: '#71717a' }} />;
}

function fmt(bytes) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── order group card ─────────────────────────────────────── */
function OrderGroup({ order, docs, isDark, onPreview, onDownload }) {
  const [open, setOpen] = useState(true);

  const card        = { bg: isDark ? '#111111' : '#ffffff', border: isDark ? '#1f1f1f' : '#e5e5e5' };
  const textPrimary = isDark ? '#fafafa' : '#0a0a0a';
  const textMuted   = isDark ? '#71717a' : '#737373';
  const divider     = isDark ? '#1f1f1f' : '#f0f0f0';
  const rowHover    = isDark ? '#161616' : '#fafafa';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: card.bg, border: `1px solid ${card.border}` }}
    >
      {/* Order header — click to collapse */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ borderBottom: open ? `1px solid ${divider}` : 'none' }}
        onMouseEnter={e => e.currentTarget.style.background = isDark ? '#0d0d0d' : '#fafafa'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,107,53,0.1)' }}>
            <Package size={16} style={{ color: '#FF6B35' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: textPrimary }}>
              {order.public_name || order.part_name || 'Unnamed Order'}
            </p>
            <p className="text-xs font-mono mt-0.5" style={{ color: textMuted }}>
              {order.rz_job_id || order.id?.slice(0, 8)} · {docs.length} document{docs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          style={{ color: textMuted, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Document rows */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {docs.map((doc, i) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                style={{ borderTop: i > 0 ? `1px solid ${divider}` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = rowHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isDark ? '#1a1a1a' : '#f4f4f5' }}>
                  {fileIcon(doc.file_type, doc.file_name)}
                </div>

                {/* Name + size */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: textPrimary }}>
                    {doc.file_name || 'Untitled'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                    {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {fmt(doc.file_size) && ` · ${fmt(doc.file_size)}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onPreview(doc)}
                    title="Preview"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: 'rgba(255,107,53,0.1)' }}
                  >
                    <Eye size={14} style={{ color: '#FF6B35' }} />
                  </button>
                  <button
                    onClick={() => onDownload(doc)}
                    title="Download"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: isDark ? '#1a1a1a' : '#f4f4f5' }}
                  >
                    <Download size={14} style={{ color: textMuted }} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── skeleton ─────────────────────────────────────────────── */
function Skeleton({ isDark }) {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: isDark ? '#111111' : '#ffffff', border: `1px solid ${isDark ? '#1f1f1f' : '#e5e5e5'}` }}>
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 rounded-xl" style={{ background: isDark ? '#1f1f1f' : '#f0f0f0' }} />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded-full w-1/3" style={{ background: isDark ? '#1f1f1f' : '#f0f0f0' }} />
          <div className="h-2.5 rounded-full w-1/5" style={{ background: isDark ? '#1a1a1a' : '#f5f5f5' }} />
        </div>
      </div>
    </div>
  );
}

/* ── main ─────────────────────────────────────────────────── */
export default function SupplierDocumentsPortal() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  const [orders, setOrders]       = useState([]);   // orders with their docs
  const [allDocs, setAllDocs]     = useState([]);   // unmatched docs (no order)
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const textPrimary = isDark ? '#fafafa' : '#0a0a0a';
  const textMuted   = isDark ? '#71717a' : '#737373';

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        // Get supplier's orders with name/id info
        const { data: supplierOrders } = await supabase
          .from('orders')
          .select('id, public_name, part_name, rz_job_id, order_status')
          .eq('supplier_id', currentUser.id)
          .order('created_at', { ascending: false });

        const orderIds = (supplierOrders || []).map(o => o.id);

        // Fetch all documents for those orders + uploaded by supplier
        let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
        if (orderIds.length > 0) {
          query = query.or(`uploaded_by.eq.${currentUser.id},order_id.in.(${orderIds.join(',')})`);
        } else {
          query = query.eq('uploaded_by', currentUser.id);
        }
        const { data: docs, error: err } = await query;
        if (err) throw err;

        // Group docs by order_id
        const docsByOrder = {};
        const unmatched = [];
        (docs || []).forEach(d => {
          if (d.order_id && orderIds.includes(d.order_id)) {
            if (!docsByOrder[d.order_id]) docsByOrder[d.order_id] = [];
            docsByOrder[d.order_id].push(d);
          } else {
            unmatched.push(d);
          }
        });

        // Attach docs to orders (only orders that have docs)
        const ordersWithDocs = (supplierOrders || [])
          .filter(o => docsByOrder[o.id]?.length > 0)
          .map(o => ({ ...o, docs: docsByOrder[o.id] }));

        setOrders(ordersWithDocs);
        setAllDocs(unmatched);
      } catch {
        setError('Failed to load documents. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const handleDownload = async (doc) => {
    try {
      if (doc.file_url) { window.open(doc.file_url, '_blank'); return; }
      const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 60);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch { /* silent */ }
  };

  // Filter by search across order name/id and doc file name
  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    const orderMatch = (o.public_name || o.part_name || '').toLowerCase().includes(s) ||
                       (o.rz_job_id || o.id).toLowerCase().includes(s);
    const docMatch   = o.docs.some(d => d.file_name?.toLowerCase().includes(s));
    return orderMatch || docMatch;
  });

  const totalDocs = orders.reduce((sum, o) => sum + o.docs.length, 0) + allDocs.length;

  return (
    <SupplierHubLayout>
      <Helmet><title>Documents — Supplier Hub</title></Helmet>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: textPrimary }}>
          Documents Portal
        </h1>
        <p className="text-sm" style={{ color: textMuted }}>
          Technical drawings, QC reports and labels — organised by order.
        </p>
      </motion.div>

      {/* Search + count */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: textMuted }} />
          <input
            type="text"
            placeholder="Search by order name or file…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: isDark ? '#111111' : '#ffffff',
              border: `1px solid ${isDark ? '#1f1f1f' : '#e5e5e5'}`,
              color: textPrimary,
            }}
            onFocus={e => e.target.style.borderColor = '#FF6B35'}
            onBlur={e => e.target.style.borderColor = isDark ? '#1f1f1f' : '#e5e5e5'}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={13} style={{ color: textMuted }} />
            </button>
          )}
        </div>
        {!loading && (
          <span className="text-xs font-medium px-3 py-1.5 rounded-xl"
            style={{ background: isDark ? '#111111' : '#ffffff', border: `1px solid ${isDark ? '#1f1f1f' : '#e5e5e5'}`, color: textMuted }}>
            {totalDocs} document{totalDocs !== 1 ? 's' : ''} across {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} isDark={isDark} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle size={32} style={{ color: '#ef4444' }} />
          <p className="text-sm font-medium" style={{ color: textMuted }}>{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#FF6B35' }}>Retry</button>
        </div>
      ) : filteredOrders.length === 0 && allDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: isDark ? '#1a1a1a' : '#f4f4f5' }}>
            <FolderOpen size={28} style={{ color: isDark ? '#3f3f46' : '#d4d4d8' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm mb-1" style={{ color: textPrimary }}>
              {search ? 'No documents match your search' : 'No documents yet'}
            </p>
            <p className="text-xs" style={{ color: textMuted }}>
              {search ? 'Try a different search term' : 'Documents from your awarded orders will appear here'}
            </p>
          </div>
          {search && (
            <button onClick={() => setSearch('')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35' }}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <OrderGroup
              key={order.id}
              order={order}
              docs={order.docs}
              isDark={isDark}
              onPreview={setPreviewDoc}
              onDownload={handleDownload}
            />
          ))}

          {/* Unmatched docs (no order link) */}
          {allDocs.length > 0 && (
            <OrderGroup
              order={{ id: 'misc', public_name: 'Other Documents', rz_job_id: null }}
              docs={allDocs}
              isDark={isDark}
              onPreview={setPreviewDoc}
              onDownload={handleDownload}
            />
          )}
        </div>
      )}

      <DocumentPreviewModal
        open={!!previewDoc}
        onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}
        filePath={previewDoc?.file_path}
        fileName={previewDoc?.file_name}
        fileUrl={previewDoc?.file_url}
      />
    </SupplierHubLayout>
  );
}
