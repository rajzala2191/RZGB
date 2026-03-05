import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Lock, Eye, Image as ImageIcon, Box, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logAssetView } from '@/lib/auditLogger';
import ThreeDModelViewer from '@/components/ThreeDModelViewer';

const MODEL_EXTENSIONS = ['.stl', '.obj', '.gltf', '.glb', '.x_t'];
const isModel = (name = '') => MODEL_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));

const AssetViewer = ({ assets, orderId }) => {
  const { currentUser } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const prevBlobUrl = useRef(null);

  // For PDFs: fetch as blob to bypass Supabase X-Frame-Options header
  useEffect(() => {
    if (prevBlobUrl.current) {
      URL.revokeObjectURL(prevBlobUrl.current);
      prevBlobUrl.current = null;
    }
    setBlobUrl(null);
    if (!selectedAsset?.file_url || selectedAsset.asset_type !== 'pdf') return;

    let cancelled = false;
    setLoadingBlob(true);
    fetch(selectedAsset.file_url)
      .then(r => r.blob())
      .then(blob => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        prevBlobUrl.current = url;
        setBlobUrl(url);
      })
      .catch(() => { if (!cancelled) setBlobUrl(null); })
      .finally(() => { if (!cancelled) setLoadingBlob(false); });

    return () => { cancelled = true; };
  }, [selectedAsset]);

  const handleView = async (asset) => {
    setSelectedAsset(asset);
    await logAssetView(currentUser.id, orderId, asset.asset_name);
  };

  const handleDownload = () => {
    if (!selectedAsset?.file_url) return;
    const a = document.createElement('a');
    a.href = selectedAsset.file_url;
    a.download = selectedAsset.asset_name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <Box size={18} className="text-sky-500" />
          Technical Assets
        </h3>
        <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Lock size={12} /> Secure Viewer
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[400px]">
        {/* Asset List */}
        <div className="border-r border-slate-800 bg-slate-900/50">
          {assets.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No assets available.</div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {assets.map((asset) => (
                <li 
                  key={asset.id}
                  onClick={() => handleView(asset)}
                  className={`p-4 cursor-pointer hover:bg-slate-800 transition-colors ${selectedAsset?.id === asset.id ? 'bg-slate-800 border-l-2 border-sky-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                      {asset.asset_type === 'pdf' ? <FileText size={20} /> : isModel(asset.asset_name) ? <Box size={20} className="text-cyan-500" /> : <ImageIcon size={20} />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-slate-200 truncate">{asset.asset_name}</p>
                      <p className="text-xs text-slate-500">{asset.file_size || 'Unknown Size'}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Viewer Area */}
        <div className="lg:col-span-2 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          {selectedAsset ? (
            <div className="relative w-full h-full flex flex-col" style={{ minHeight: '400px' }}>
              {/* File Render */}
              {selectedAsset.file_url ? (
                selectedAsset.asset_type === 'pdf' ? (
                  loadingBlob ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                      <Loader2 size={32} className="animate-spin" />
                    </div>
                  ) : blobUrl ? (
                    <iframe
                      src={blobUrl}
                      title={selectedAsset.asset_name}
                      className="w-full flex-1"
                      style={{ minHeight: '400px', border: 'none' }}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                      <FileText size={48} className="mb-3 opacity-30" />
                      <p className="text-sm">Failed to load PDF</p>
                    </div>
                  )
                ) : isModel(selectedAsset.asset_name) ? (
                  <div className="flex-1 p-4">
                    <ThreeDModelViewer url={selectedAsset.file_url} fileName={selectedAsset.asset_name} />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                    <img
                      src={selectedAsset.file_url}
                      alt={selectedAsset.asset_name}
                      className="max-w-full max-h-[500px] object-contain rounded shadow-lg"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <FileText size={48} className="mb-3 opacity-30" />
                  <p className="text-sm">Preview unavailable</p>
                </div>
              )}

              {/* Watermark */}
              <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
                <p className="transform -rotate-45 text-white/5 text-4xl font-black whitespace-nowrap select-none">
                  RZ GLOBAL • {currentUser?.id?.slice(0, 8).toUpperCase()} • CONFIDENTIAL
                </p>
              </div>

              {/* Download */}
              <div className="absolute bottom-4 right-4 z-20">
                {selectedAsset.download_enabled && selectedAsset.file_url ? (
                  <a
                    href={selectedAsset.file_url}
                    download={selectedAsset.asset_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg"
                  >
                    <Download size={16} /> Download
                  </a>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-sm font-bold border border-slate-700">
                    <Lock size={16} /> Download Locked
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-600">
              <Eye size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select an asset to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetViewer;