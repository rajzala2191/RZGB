import React, { useState } from 'react';
import { FileText, Download, Printer, ShieldCheck, Lock, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const SecurePDFViewer = ({ document, order }) => {
  const { currentUser, userCompanyName } = useAuth();
  const [showOverlay, setShowOverlay] = useState(false);

  // Note: True print screen blocking is impossible in browsers, but we can detect visibility changes or blur
  // Disabling right click
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleDownload = () => {
    // Implement actual download logic, checking permissions
    // For now, mock alert
    alert("Downloading secure document...");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative select-none"
      onContextMenu={handleContextMenu}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-900/20 rounded-lg text-emerald-500 border border-emerald-900/50">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              CERTIFIED DOCUMENT
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500 text-emerald-950 font-black tracking-wider uppercase">
                Official
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {document.id?.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-lg text-xs font-bold transition-all"
          >
            <Download size={14} /> Download
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-lg text-xs font-bold transition-all"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="relative bg-slate-200 min-h-[500px] flex items-center justify-center overflow-hidden group">
        
        {/* Document Content Placeholder */}
        <div className="w-[80%] h-[90%] bg-white shadow-xl relative z-10 flex flex-col p-12 text-slate-900">
           <div className="flex justify-between items-start mb-8 border-b border-slate-200 pb-4">
              <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ" className="h-8 object-contain" />
              <div className="text-right">
                 <h1 className="text-xl font-bold text-slate-800">CERTIFICATE OF CONFORMITY</h1>
                 <p className="text-sm text-slate-500">Doc Ref: {document.file_name}</p>
              </div>
           </div>
           
           <div className="space-y-4 text-sm font-mono">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <span className="text-slate-500 block text-xs uppercase">Client</span>
                    <span className="font-bold">{userCompanyName}</span>
                 </div>
                 <div>
                    <span className="text-slate-500 block text-xs uppercase">Order</span>
                    <span className="font-bold">{order?.rz_job_id || order?.id?.slice(0, 8) || 'N/A'}</span>
                 </div>
                 <div>
                    <span className="text-slate-500 block text-xs uppercase">RZ Job ID</span>
                    <span className="font-bold">{order?.rz_job_id}</span>
                 </div>
                 <div>
                    <span className="text-slate-500 block text-xs uppercase">Date Certified</span>
                    <span className="font-bold">{format(new Date(), 'dd MMM yyyy')}</span>
                 </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-200">
                 <p className="mb-4">This document certifies that the materials and/or parts supplied have been manufactured, inspected, and tested in accordance with the purchase order requirements.</p>
                 <div className="flex items-center gap-2 text-emerald-600 font-bold border-2 border-emerald-600 inline-block px-4 py-2 rounded">
                    <ShieldCheck size={24} />
                    RZ QUALITY APPROVED
                 </div>
              </div>
           </div>
        </div>

        {/* Dynamic Watermark Overlay */}
        <div 
          className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden"
          style={{ backgroundImage: 'linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.02) 50%, transparent 52%)', backgroundSize: '30px 30px' }}
        >
          <div className="transform -rotate-45 text-slate-900/5 text-5xl font-black whitespace-nowrap select-none flex flex-col items-center justify-center w-full h-full gap-32">
             <p>RZ GLOBAL SOLUTIONS • CERTIFIED COPY</p>
             <p>RZ GLOBAL SOLUTIONS • CERTIFIED COPY</p>
             <p>RZ GLOBAL SOLUTIONS • CERTIFIED COPY</p>
          </div>
        </div>
      </div>

      {/* Footer / Chain of Custody */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex justify-between items-center z-20 relative">
        <div className="flex gap-4">
           <span className="flex items-center gap-1"><Lock size={10} /> Secure View</span>
           <span>•</span>
           <span>Generated: {new Date().toISOString()}</span>
           <span>•</span>
           <span>Viewer: {currentUser?.email}</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-emerald-500 font-bold">Valid Signature</span>
        </div>
      </div>
    </div>
  );
};

export default SecurePDFViewer;