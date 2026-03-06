import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, FileImage, FolderOpen, Eye, Download,
  Search, Filter, AlertCircle, X, File,
} from 'lucide-react';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { DocumentPreviewModal } from '@/components/DocumentPreview';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

/* ── helpers ──────────────────────────────────────────────── */
const DOC_TYPES = ['All', 'drawing', 'qc_report', 'shipping_label', 'certificate', 'other'];

const TYPE_META = {
  drawing:        { label: 'Drawing',        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  qc_report:      { label: 'QC Report',      color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  shipping_label: { label: 'Shipping Label', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  certificate:    { label: 'Certificate',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  other:          { label: 'Other',          color: '#71717a', bg: 'rgba(113,113,122,0.1)' },
};

const getTypeMeta = (t) => TYPE_META[t] || TYPE_META.other;

function fileIcon(type) {
  if (type?.includes('pdf'))   return <FileText size={18} style={{ color: '#ef4444' }} />;
  if (type?.includes('image')) return <FileImage size={18} style={{ color: '#f97316' }} />;
  return <File size={18} style={{ color: '#71717a' }} />;
}

function fmt(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── skeleton row ─────────────────────────────────────────── */
function SkeletonRow({ isDark }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: isDark ? '#1f1f1f' : '#f0f0f0' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded-full w-2/5" style={{ background: isDark ? '#1f1f1f' : '#f0f0f0' }} />
        <div className="h-2.5 rounded-full w-1/4" style={{ background: isDark ? '#1a1a1a' : '#f5f5f5' }} />
      </div>
      <div className="h-6 w-20 rounded-full" style={{ background: isDark ? '#1f1f1f' : '#f0f0f0' }} />
      <div className="h-3 w-16 rounded-full" style={{ background: isDark ? '#1a1a1a' : '#f5f5f5' }} />
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-lg" style={{ background: isDark ? '#1f1f1f' : '#f0f0f0' }} />
        <div className="w-8 h-8 rounded-lg" style={{ background: isDark ? '#1f1f1f' : '#f0f0f0' }} />
      </div>
    </div>
  );
}

/* ── main ─────────────────────────────────────────────────── */
export default function SupplierDocumentsPortal() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [previewDoc, setPreviewDoc] = useState(null);

  const card        = { bg: isDark ? '#111111' : '#ffffff', border: isDark ? '#1f1f1f' : '#e5e5e5' };
  const textPrimary = isDark ? '#fafafa' : '#0a0a0a';
  const textMuted   = isDark ? '#71717a' : '#737373';
  const divider     = isDark ? '#1f1f1f' : '#f0f0f0';
  const rowHover    = isDark ? '#161616' : '#fafafa';

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        // Documents are linked to orders; orders have supplier_id.
        // Step 1: get order IDs awarded to this supplier.
        const { data: supplierOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('supplier_id', currentUser.id);

        const orderIds = (supplierOrders || []).map(o => o.id);

        // Step 2: fetch documents uploaded by the supplier OR on their orders.
        let query = supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (orderIds.length > 0) {
          query = query.or(`uploaded_by.eq.${currentUser.id},order_id.in.(${orderIds.join(',')})`);
        } else {
          query = query.eq('uploaded_by', currentUser.id);
        }

        const { data, error: err } = await query;
        if (err) throw err;
        setDocuments(data || []);
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
      if (doc.file_url) {
        window.open(doc.file_url, '_blank');
        return;
      }
      const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 60);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch {
      /* silent */
    }
  };

  const filtered = documents.filter(d => {
    const matchSearch = d.file_name?.toLowerCase().includes(search.toLowerCase()) ||
                        d.order_id?.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === 'All' || d.document_type === typeFilter || d.file_type === typeFilter;
    return matchSearch && matchType;
  });

  /* stats */
  const totalByType = DOC_TYPES.slice(1).reduce((acc, t) => {
    acc[t] = documents.filter(d => d.document_type === t || d.file_type === t).length;
    return acc;
  }, {});

  return (
    <SupplierHubLayout>
      <Helmet><title>Documents — Supplier Hub</title></Helmet>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: textPrimary }}>
          Documents Portal
        </h1>
        <p className="text-sm" style={{ color: textMuted }}>
          Access technical drawings, QC reports, shipping labels and certificates.
        </p>
      </motion.div>

      {/* ── Stat Pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-3 mb-6"
      >
        {[
          { label: 'All Documents', value: documents.length, color: '#FF6B35' },
          ...DOC_TYPES.slice(1).map(t => ({
            label: getTypeMeta(t).label,
            value: totalByType[t] || 0,
            color: getTypeMeta(t).color,
          })),
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold"
            style={{ background: isDark ? '#111111' : '#ffffff', border: `1px solid ${isDark ? '#1f1f1f' : '#e5e5e5'}`, color: textMuted }}>
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            {label}
            <span className="font-black" style={{ color }}>{value}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Search & Filter ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-5"
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: textMuted }} />
          <input
            type="text"
            placeholder="Search by file name or order ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
              color: textPrimary,
            }}
            onFocus={e => e.target.style.borderColor = '#FF6B35'}
            onBlur={e => e.target.style.borderColor = card.border}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} style={{ color: textMuted }} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} style={{ color: textMuted }} />
          {DOC_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: typeFilter === t ? '#FF6B35' : (isDark ? '#111111' : '#ffffff'),
                color:      typeFilter === t ? '#ffffff'  : textMuted,
                border:     `1px solid ${typeFilter === t ? '#FF6B35' : card.border}`,
              }}
            >
              {t === 'All' ? 'All' : getTypeMeta(t).label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Document Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: card.bg, border: `1px solid ${card.border}` }}
      >
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: textMuted, borderBottom: `1px solid ${divider}`, background: isDark ? '#0d0d0d' : '#fafafa' }}>
          <span>Document</span>
          <span>Type</span>
          <span>Order</span>
          <span>Date</span>
          <span className="text-right pr-2">Actions</span>
        </div>

        {loading ? (
          <div className="divide-y" style={{ borderColor: divider }}>
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} isDark={isDark} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle size={32} style={{ color: '#ef4444' }} />
            <p className="text-sm font-medium" style={{ color: textMuted }}>{error}</p>
            <button onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#FF6B35' }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: isDark ? '#1a1a1a' : '#f4f4f5' }}>
              <FolderOpen size={28} style={{ color: isDark ? '#3f3f46' : '#d4d4d8' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm mb-1" style={{ color: textPrimary }}>
                {search || typeFilter !== 'All' ? 'No documents match your search' : 'No documents yet'}
              </p>
              <p className="text-xs" style={{ color: textMuted }}>
                {search || typeFilter !== 'All' ? 'Try adjusting your filters' : 'Documents shared with you will appear here'}
              </p>
            </div>
            {(search || typeFilter !== 'All') && (
              <button onClick={() => { setSearch(''); setTypeFilter('All'); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35' }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((doc, i) => {
              const meta = getTypeMeta(doc.document_type || doc.file_type);
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center cursor-pointer transition-colors"
                  style={{ borderTop: i > 0 ? `1px solid ${divider}` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* File name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: isDark ? '#1a1a1a' : '#f4f4f5' }}>
                      {fileIcon(doc.file_type || doc.file_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                        {doc.file_name || 'Untitled'}
                      </p>
                      {doc.file_size && (
                        <p className="text-xs mt-0.5" style={{ color: textMuted }}>{fmt(doc.file_size)}</p>
                      )}
                    </div>
                  </div>

                  {/* Type badge */}
                  <div>
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Order ID */}
                  <p className="text-xs font-mono" style={{ color: textMuted }}>
                    {doc.order_id?.slice(0, 8) || '—'}
                  </p>

                  {/* Date */}
                  <p className="text-xs" style={{ color: textMuted }}>
                    {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      title="Preview"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                      style={{ background: 'rgba(255,107,53,0.1)' }}
                    >
                      <Eye size={14} style={{ color: '#FF6B35' }} />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      title="Download"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                      style={{ background: isDark ? '#1a1a1a' : '#f4f4f5' }}
                    >
                      <Download size={14} style={{ color: textMuted }} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Results count */}
        {!loading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 text-xs font-medium" style={{ color: textMuted, borderTop: `1px solid ${divider}` }}>
            Showing {filtered.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
          </div>
        )}
      </motion.div>

      {/* Preview Modal */}
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
