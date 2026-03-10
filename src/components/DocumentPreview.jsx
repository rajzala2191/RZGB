import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  FileText, Image as ImageIcon, Download, X,
  Loader2, AlertCircle, RefreshCw, Maximize2,
  ChevronLeft, ChevronRight, Eye,
} from 'lucide-react';

/* ── helpers ────────────────────────────────────────────────── */
const EXT_ICONS = {
  pdf:  { color: '#ef4444', label: 'PDF'  },
  jpg:  { color: '#f59e0b', label: 'JPG'  },
  jpeg: { color: '#f59e0b', label: 'JPEG' },
  png:  { color: '#3b82f6', label: 'PNG'  },
  gif:  { color: '#a855f7', label: 'GIF'  },
  webp: { color: '#06b6d4', label: 'WEBP' },
  svg:  { color: '#10b981', label: 'SVG'  },
  step: { color: '#8b5cf6', label: 'STEP' },
  dxf:  { color: '#f97316', label: 'DXF'  },
};

const getExt  = (name = '') => (name.split('.').pop() || '').toLowerCase();
const isImage = (name) => ['jpg','jpeg','png','gif','webp','bmp','svg'].includes(getExt(name));
const isPdf   = (name) => getExt(name) === 'pdf';
const isPreviewable = (name) => isImage(name) || isPdf(name);

/* ── Lightbox overlay ───────────────────────────────────────── */
function Lightbox({ files, activeIndex, onClose, onPrev, onNext }) {
  const file = files[activeIndex];
  const multi = files.length > 1;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const handleDownload = () => {
    if (!file.url) return;
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name || 'document';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isImage(file.name)
            ? <ImageIcon size={16} className="text-orange-400 flex-shrink-0" />
            : <FileText  size={16} className="text-red-400 flex-shrink-0" />}
          <span className="text-sm font-semibold text-white truncate">{file.name}</span>
          {multi && (
            <span className="text-xs text-white/40 flex-shrink-0">
              {activeIndex + 1} / {files.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/80 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Download size={13} /> Download
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {/* Prev / Next */}
        {multi && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-3 z-10 flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={onNext}
              className="absolute right-3 z-10 flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Loading */}
        {file.loading && (
          <div className="flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={32} className="animate-spin text-orange-500" />
            <span className="text-sm">Loading preview…</span>
          </div>
        )}

        {/* Error */}
        {!file.loading && file.error && (
          <div className="flex flex-col items-center gap-3 text-white/50">
            <AlertCircle size={32} className="text-amber-500" />
            <span className="text-sm">{file.error}</span>
          </div>
        )}

        {/* Image */}
        {!file.loading && !file.error && file.url && isImage(file.name) && (
          <img
            src={file.url}
            alt={file.name}
            className="max-h-full max-w-full object-contain select-none"
            style={{ padding: '2rem' }}
            draggable={false}
          />
        )}

        {/* PDF */}
        {!file.loading && !file.error && file.url && isPdf(file.name) && (
          <iframe
            src={file.url}
            title={file.name}
            className="w-full h-full border-0"
            style={{ background: '#ffffff' }}
          />
        )}

        {/* Non-previewable */}
        {!file.loading && !file.error && file.url && !isPreviewable(file.name) && (
          <div className="flex flex-col items-center gap-4 text-white/50">
            <FileText size={48} />
            <p className="text-sm">Preview not available for .{getExt(file.name)} files</p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#FF6B35' }}
            >
              <Download size={15} /> Download File
            </button>
          </div>
        )}
      </div>

      {/* Thumbnail strip (multi-file) */}
      {multi && (
        <div
          className="flex items-center gap-2 px-4 py-3 overflow-x-auto flex-shrink-0"
          style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {files.map((f, i) => {
            const ext = getExt(f.name);
            const cfg = EXT_ICONS[ext] || { color: '#71717a', label: ext.toUpperCase() };
            return (
              <button
                key={i}
                onClick={() => files._setActive(i)}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: i === activeIndex ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${i === activeIndex ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  minWidth: 56,
                }}
              >
                {isImage(f.name) && f.url ? (
                  <img src={f.url} alt={f.name} className="w-8 h-8 object-cover rounded" />
                ) : (
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: `${cfg.color}20` }}>
                    <span className="text-[9px] font-black" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                )}
                <span className="text-[10px] text-white/40 max-w-[60px] truncate">{f.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Document card (thumbnail in page) ─────────────────────── */
function DocCard({ file, onOpen, compact }) {
  const ext = getExt(file.name);
  const cfg = EXT_ICONS[ext] || { color: '#71717a', label: ext.toUpperCase() || 'FILE' };

  return (
    <div
      className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:scale-[1.02]"
      style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
      onClick={onOpen}
    >
      {/* Preview area */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: 160, background: '#f4f4f5' }}
      >
        {file.loading ? (
          <Loader2 size={20} className="animate-spin text-orange-500" />
        ) : file.url && isImage(file.name) ? (
          <img src={file.url} alt={file.name} className="w-full h-full object-contain" style={{ padding: '8px' }} />
        ) : file.url && isPdf(file.name) ? (
          <iframe
            src={`${file.url}#toolbar=0&navpanes=0&scrollbar=0`}
            title={file.name}
            className="w-full border-0 pointer-events-none"
            style={{ height: 200, marginTop: -40, transform: 'scale(0.75)', transformOrigin: 'top center' }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${cfg.color}15` }}>
              <FileText size={20} style={{ color: cfg.color }} />
            </div>
            <span className="text-[10px] font-black uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: '#FF6B35' }}>
            <Maximize2 size={12} /> View
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5" style={{ borderTop: '1px solid #e5e5e5' }}>
        <p className="text-xs font-semibold truncate" style={{ color: '#18181b' }}>
          {file.name}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] font-bold uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
          {file.size && <span className="text-[10px]" style={{ color: '#a1a1aa' }}>{file.size}</span>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main exported component — single file preview card
   Props: filePath, fileName, fileUrl, bucket, compact, className
   ═══════════════════════════════════════════════════════════════ */
const DocumentPreview = ({ filePath, fileName, fileUrl: directUrl, bucket = 'documents', compact = false, className = '' }) => {
  const [url,     setUrl]     = useState(directUrl || null);
  const [loading, setLoading] = useState(!directUrl);
  const [error,   setError]   = useState(null);
  const [open,    setOpen]    = useState(false);

  const load = useCallback(async () => {
    if (directUrl) { setUrl(directUrl); setLoading(false); return; }
    if (!filePath) { setError('No file provided'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabaseAdmin.storage.from(bucket).createSignedUrl(filePath, 86400);
      if (e) throw e;
      setUrl(data?.signedUrl || null);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filePath, directUrl, bucket]);

  useEffect(() => { load(); }, [load]);

  const file = { name: fileName || filePath || 'Document', url, loading, error, size: null };
  // Attach _setActive noop for single-file lightbox
  const files = Object.assign([file], { _setActive: () => {} });

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = file.name; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  if (loading) return (
    <div className={`flex items-center justify-center p-6 rounded-xl ${className}`} style={{ background: '#f4f4f5', border: '1px solid #e5e5e5' }}>
      <Loader2 size={18} className="animate-spin text-orange-500 mr-2" />
      <span className="text-sm" style={{ color: '#737373' }}>Loading preview…</span>
    </div>
  );

  if (error) return (
    <div className={`p-4 rounded-xl ${className}`} style={{ background: '#f4f4f5', border: '1px solid #e5e5e5' }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: '#f59e0b' }}>
        <AlertCircle size={15} />
        <span className="text-sm font-medium">Preview unavailable</span>
      </div>
      <p className="text-xs mb-3" style={{ color: '#a1a1aa' }}>{error}</p>
      <button onClick={load} className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-400">
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  );

  return (
    <>
      <DocCard file={file} onOpen={() => setOpen(true)} />
      {open && (
        <Lightbox
          files={files}
          activeIndex={0}
          onClose={() => setOpen(false)}
          onPrev={() => {}}
          onNext={() => {}}
        />
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DocumentGallery — multi-file lightbox grid
   Props: documents: Array<{ id, file_path, file_name, file_size? }>
          bucket, signedUrls (optional pre-fetched map { id: url })
   ═══════════════════════════════════════════════════════════════ */
export function DocumentGallery({ documents = [], bucket = 'documents', signedUrls = {} }) {
  const [urls,   setUrls]   = useState(signedUrls);
  const [active, setActive] = useState(null); // index into documents

  // Fetch any missing signed URLs
  useEffect(() => {
    const missing = documents.filter(d => !urls[d.id] && d.file_path);
    if (!missing.length) return;
    Promise.all(
      missing.map(async d => {
        const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrl(d.file_path, 86400);
        return [d.id, data?.signedUrl || null];
      })
    ).then(entries => setUrls(prev => ({ ...prev, ...Object.fromEntries(entries) })));
  }, [documents, bucket]);

  if (!documents.length) return null;

  const files = documents.map(d => ({
    name:    d.file_name || d.file_path || 'Document',
    url:     urls[d.id] || null,
    loading: !urls[d.id],
    error:   null,
    size:    d.file_size || null,
  }));
  // Attach _setActive for thumbnail strip navigation
  Object.assign(files, { _setActive: setActive });

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {files.map((f, i) => (
          <DocCard key={i} file={f} onOpen={() => setActive(i)} />
        ))}
      </div>
      {active !== null && (
        <Lightbox
          files={files}
          activeIndex={active}
          onClose={() => setActive(null)}
          onPrev={() => setActive(i => Math.max(0, i - 1))}
          onNext={() => setActive(i => Math.min(files.length - 1, i + 1))}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DocumentPreviewModal — modal triggered externally
   Props: open, onOpenChange, filePath, fileName, fileUrl, bucket
   ═══════════════════════════════════════════════════════════════ */
export const DocumentPreviewModal = ({ open, onOpenChange, filePath, fileName, fileUrl, bucket = 'documents' }) => {
  const [url,     setUrl]     = useState(fileUrl || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (fileUrl) { setUrl(fileUrl); return; }
    if (!filePath) return;
    setLoading(true);
    supabaseAdmin.storage.from(bucket).createSignedUrl(filePath, 3600)
      .then(({ data }) => setUrl(data?.signedUrl || null))
      .catch(() => setUrl(null))
      .finally(() => setLoading(false));
  }, [open, filePath, fileUrl, bucket]);

  if (!open) return null;

  const file  = { name: fileName || filePath || 'Document', url, loading: loading && !url, error: null };
  const files = Object.assign([file], { _setActive: () => {} });

  return (
    <Lightbox
      files={files}
      activeIndex={0}
      onClose={() => onOpenChange(false)}
      onPrev={() => {}}
      onNext={() => {}}
    />
  );
};

export default DocumentPreview;
