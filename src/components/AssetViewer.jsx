import React, { useState } from 'react';
import { FileText, Download, Lock, Eye, Image as ImageIcon, Box } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logAssetView } from '@/lib/auditLogger';

const AssetViewer = ({ assets, orderId }) => {
  const { currentUser } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState(null);

  const handleView = async (asset) => {
    setSelectedAsset(asset);
    await logAssetView(currentUser.id, orderId, asset.asset_name);
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
                      {asset.asset_type === 'pdf' ? <FileText size={20} /> : <ImageIcon size={20} />}
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
        <div className="lg:col-span-2 relative bg-slate-950 flex items-center justify-center overflow-hidden select-none">
          {selectedAsset ? (
            <div 
              className="relative w-full h-full flex items-center justify-center p-8"
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Mock Content */}
              <div className="bg-white/90 p-12 rounded shadow-2xl max-w-lg text-slate-900 text-center relative z-10">
                 <FileText size={64} className="mx-auto mb-4 text-slate-400" />
                 <h4 className="text-xl font-bold mb-2">{selectedAsset.asset_name}</h4>
                 <p className="text-sm text-slate-500">Preview Mode</p>
                 <div className="mt-6 p-4 bg-slate-100 rounded text-xs font-mono text-left">
                    <p>SPECIFICATION: RZ-STD-884</p>
                    <p>TOLERANCE: +/- 0.05mm</p>
                    <p>MATERIAL: AL-6061-T6</p>
                    <p className="blur-[2px] select-none mt-2">Confidential technical data...</p>
                 </div>
              </div>

              {/* Watermark Overlay */}
              <div 
                className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden"
                style={{ backgroundImage: 'linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.05) 50%, transparent 52%)', backgroundSize: '20px 20px' }}
              >
                <div className="transform -rotate-45 text-slate-500/10 text-4xl font-black whitespace-nowrap select-none">
                  RZ PROPRIETARY • {currentUser?.id?.slice(0,8).toUpperCase()} • DO NOT DISTRIBUTE
                </div>
              </div>

              {/* Secure Actions */}
              <div className="absolute bottom-4 right-4 z-30 flex gap-2">
                 <button 
                   disabled={!selectedAsset.download_enabled}
                   className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-bold border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:text-white transition-colors"
                 >
                   {selectedAsset.download_enabled ? <Download size={16} /> : <Lock size={16} />}
                   {selectedAsset.download_enabled ? 'Download' : 'Download Locked'}
                 </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-600">
              <Eye size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select an asset to view securely</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetViewer;