import React, { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { FileText, Image as ImageIcon, Download, Maximize2, Minimize2, X, Loader2, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/**
 * Universal Document Preview Component
 * 
 * Supports inline preview for PDFs, images (jpg, png, jpeg, gif, webp),
 * and download fallback for other file types.
 * 
 * Props:
 *  - filePath: string — Supabase storage path (e.g. "supplier-docs/abc-123.pdf")
 *  - fileName: string — Display name of the file
 *  - fileUrl?: string — Optional direct URL (skips signed URL generation)
 *  - bucket?: string — Supabase storage bucket name (default: "documents")
 *  - compact?: boolean — Show compact inline preview (default: false)
 *  - className?: string — Additional CSS classes for the wrapper
 *  - onClose?: () => void — Callback when preview is closed (for modal use)
 */
const DocumentPreview = ({ filePath, fileName, fileUrl: directUrl, bucket = 'documents', compact = false, className = '', onClose }) => {
  const [signedUrl, setSignedUrl] = useState(directUrl || null);
  const [loading, setLoading] = useState(!directUrl);
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  const fileExtension = (fileName || filePath || '').split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExtension);
  const isPdf = fileExtension === 'pdf';
  const isPreviewable = isImage || isPdf;

  const generateSignedUrl = useCallback(async () => {
    if (directUrl) {
      setSignedUrl(directUrl);
      setLoading(false);
      return;
    }
    if (!filePath) {
      setError('No file path provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: urlError } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (urlError) throw urlError;
      if (!data?.signedUrl) throw new Error('No signed URL returned');

      setSignedUrl(data.signedUrl);
    } catch (err) {
      console.error('Failed to generate signed URL:', err);
      setError(err.message || 'Failed to load document preview');
    } finally {
      setLoading(false);
    }
  }, [filePath, directUrl, bucket]);

  useEffect(() => {
    generateSignedUrl();
  }, [generateSignedUrl]);

  const handleDownload = () => {
    if (signedUrl) {
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = fileName || 'document';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-6 bg-slate-800/50 rounded-lg border border-slate-700 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-cyan-500 mr-2" />
        <span className="text-slate-400 text-sm">Loading preview...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-slate-800/50 rounded-lg border border-slate-700 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Preview unavailable</span>
        </div>
        <p className="text-xs text-slate-500 mb-3">{error}</p>
        <button
          onClick={generateSignedUrl}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  // Non-previewable file — show download card
  if (!isPreviewable) {
    return (
      <div className={`bg-slate-800/50 rounded-lg border border-slate-700 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-600">
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 font-medium truncate">{fileName}</p>
            <p className="text-xs text-slate-500 uppercase">{fileExtension} file</p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>
    );
  }

  // Compact inline preview
  if (compact) {
    return (
      <div className={`bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden ${className}`}>
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            {isImage ? <ImageIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /> : <FileText className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
            <span className="text-xs text-slate-300 font-medium truncate">{fileName}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFullscreen(true)}
              className="p-1 text-slate-500 hover:text-white transition-colors rounded"
              title="Fullscreen preview"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1 text-slate-500 hover:text-cyan-400 transition-colors rounded"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {isImage ? (
          <div className="relative bg-slate-900 flex items-center justify-center p-2 cursor-pointer" onClick={() => setFullscreen(true)}>
            <img
              src={signedUrl}
              alt={fileName}
              className="max-h-48 max-w-full object-contain rounded"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="relative cursor-pointer" onClick={() => setFullscreen(true)}>
            <iframe
              src={`${signedUrl}#toolbar=0`}
              title={fileName}
              className="w-full h-48 border-0"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 rounded-lg text-white text-xs font-bold">
                <Maximize2 className="w-3.5 h-3.5" /> Click to expand
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Dialog */}
        <Dialog open={fullscreen} onOpenChange={setFullscreen}>
          <DialogContent className="max-w-6xl max-h-[90vh] bg-[#0b1120] border-slate-700 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-700">
              <div className="flex items-center gap-2">
                {isImage ? <ImageIcon className="w-4 h-4 text-cyan-400" /> : <FileText className="w-4 h-4 text-red-400" />}
                <span className="text-sm text-slate-200 font-bold">{fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto" style={{ height: 'calc(90vh - 60px)' }}>
              {isImage ? (
                <div className="flex items-center justify-center p-4 h-full bg-slate-900">
                  <img
                    src={signedUrl}
                    alt={fileName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <iframe
                  src={signedUrl}
                  title={fileName}
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full inline preview (default)
  return (
    <div className={`bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          {isImage ? <ImageIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" /> : <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />}
          <span className="text-sm text-slate-200 font-medium truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFullscreen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-bold transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Expand
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1 text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>
      {isImage ? (
        <div className="bg-slate-900 flex items-center justify-center p-4">
          <img
            src={signedUrl}
            alt={fileName}
            className="max-h-80 max-w-full object-contain rounded cursor-pointer"
            loading="lazy"
            onClick={() => setFullscreen(true)}
          />
        </div>
      ) : (
        <iframe
          src={signedUrl}
          title={fileName}
          className="w-full border-0"
          style={{ height: '500px' }}
          loading="lazy"
        />
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-[#0b1120] border-slate-700 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-700">
            <div className="flex items-center gap-2">
              {isImage ? <ImageIcon className="w-4 h-4 text-cyan-400" /> : <FileText className="w-4 h-4 text-red-400" />}
              <span className="text-sm text-slate-200 font-bold">{fileName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto" style={{ height: 'calc(90vh - 60px)' }}>
            {isImage ? (
              <div className="flex items-center justify-center p-4 h-full bg-slate-900">
                <img
                  src={signedUrl}
                  alt={fileName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <iframe
                src={signedUrl}
                title={fileName}
                className="w-full h-full border-0"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * DocumentPreviewModal — Full-screen modal wrapper for document preview
 * Use this for "View" buttons that open a document in a dialog overlay.
 *
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open: boolean) => void
 *  - filePath, fileName, fileUrl, bucket — same as DocumentPreview
 */
export const DocumentPreviewModal = ({ open, onOpenChange, filePath, fileName, fileUrl, bucket = 'documents' }) => {
  const [signedUrl, setSignedUrl] = useState(fileUrl || null);
  const [loading, setLoading] = useState(false);

  const fileExtension = (fileName || filePath || '').split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExtension);
  const isPdf = fileExtension === 'pdf';

  useEffect(() => {
    if (!open) return;
    if (fileUrl) {
      setSignedUrl(fileUrl);
      return;
    }
    if (!filePath) return;

    const fetchUrl = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600);
        if (error) throw error;
        setSignedUrl(data?.signedUrl || null);
      } catch (err) {
        console.error('Failed to get signed URL:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUrl();
  }, [open, filePath, fileUrl, bucket]);

  const handleDownload = () => {
    if (signedUrl) {
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = fileName || 'document';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-[#0b1120] border-slate-700 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            {isImage ? <ImageIcon className="w-4 h-4 text-cyan-400" /> : <FileText className="w-4 h-4 text-red-400" />}
            <span className="text-sm text-slate-200 font-bold truncate">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto" style={{ height: 'calc(90vh - 60px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : !signedUrl ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <AlertCircle className="w-10 h-10 mb-3" />
              <p>Could not load document preview</p>
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center p-4 h-full bg-slate-900">
              <img src={signedUrl} alt={fileName} className="max-h-full max-w-full object-contain" />
            </div>
          ) : isPdf ? (
            <iframe src={signedUrl} title={fileName} className="w-full h-full border-0" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText className="w-12 h-12 mb-3" />
              <p className="mb-4">Preview not available for this file type.</p>
              <button onClick={handleDownload} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-bold hover:bg-cyan-500 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" /> Download File
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreview;
