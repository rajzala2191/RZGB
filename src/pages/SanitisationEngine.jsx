import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { useDropzone } from 'react-dropzone';
import { ShieldCheck, Upload, FileText, CheckCircle, XCircle, Wand2, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { createAuditLog, logMetadataScrub, logFileRelease } from '@/lib/auditLogger';
import { useToast } from '@/components/ui/use-toast';

const SanitisationEngine = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeFile, setActiveFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [sanitised, setSanitised] = useState(false);
  
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setActiveFile({
        file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        uploadedAt: new Date(),
        supplier: 'GHOST-SUP-01', // Mock
        previewUrl: URL.createObjectURL(file)
      });
      setSanitised(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg']},
    multiple: false
  });

  const handleScrubMetadata = async () => {
    if (!activeFile) return;
    setProcessing(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSanitised(true);
      
      // Log Action
      if (currentUser) {
        await logMetadataScrub(currentUser.id, 'temp-id', activeFile.name);
      }
      
      toast({
        title: "Metadata Scrubbed",
        description: "Supplier identity traces removed. Branding overlay applied.",
        className: "bg-emerald-600 border-emerald-700 text-white"
      });
    } catch (e) {
      console.error("Scrubbing failed", e);
      toast({
         title: "Processing Failed",
         description: "Could not scrub document.",
         variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRelease = async () => {
    if (!activeFile || !sanitised) return;
    
    if(confirm("Are you sure you want to release this document to the Client Vault? This action cannot be undone.")) {
       try {
         // Simulate DB update
         if (currentUser) {
            await logFileRelease(currentUser.id, 'temp-id', 'CLIENT-001');
         }
         
         toast({
           title: "Document Released",
           description: `RZ-QC-${Math.floor(Math.random() * 1000)}.pdf moved to client vault.`,
           className: "bg-sky-600 border-sky-700 text-white"
         });
         
         setActiveFile(null);
         setSanitised(false);
       } catch (e) {
         console.error("Release failed", e);
         toast({ title: "Release failed", variant: "destructive" });
       }
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter rejection reason for supplier:");
    if (reason) {
      try {
        if (currentUser) {
          await createAuditLog({
            userId: currentUser.id,
            action: 'DOCUMENT_REJECT',
            details: `Rejected ${activeFile.name}. Reason: ${reason}`,
            status: 'success'
          });
        }
        
        toast({
          title: "Document Rejected",
          description: "Supplier has been notified.",
          variant: "destructive"
        });
        setActiveFile(null);
        setSanitised(false);
      } catch (e) {
        console.error("Reject log failed", e);
      }
    }
  };

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>Sanitisation Engine - Ghost Portal</title>
      </Helmet>

      <div className="h-[calc(100vh-140px)] flex flex-col">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
              <ShieldCheck className="text-sky-500" size={32} />
              Sanitisation Engine
            </h1>
            <p className="text-slate-400 mt-1">Deep-clean supplier documents before client release.</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* LEFT: Raw Upload / Preview */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-400 text-sm uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} /> Raw Input
              </span>
              {activeFile && <span className="text-xs text-amber-500 font-mono">UNSANITIZED</span>}
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {!activeFile ? (
                <div 
                  {...getRootProps()} 
                  className={`h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all
                    ${isDragActive ? 'border-sky-500 bg-sky-900/10' : 'border-slate-700 hover:border-sky-500 hover:bg-slate-900/50'}
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload size={48} className="text-slate-500 mb-4" />
                  <p className="text-slate-300 font-medium text-lg">Drag & Drop Supplier Document</p>
                  <p className="text-slate-500 text-sm mt-2">or click to browse local files</p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {/* File Metadata Card */}
                  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 block">Filename</span>
                        <span className="text-slate-200 font-mono truncate block" title={activeFile.name}>{activeFile.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Size</span>
                        <span className="text-slate-200">{activeFile.size}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Source</span>
                        <span className="text-slate-200">{activeFile.supplier}</span>
                      </div>
                      <div>
                         <span className="text-slate-500 block">Status</span>
                         <span className="text-amber-500 flex items-center gap-1"><AlertTriangle size={12} /> Metadata Detected</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Area (Simulated) */}
                  <div className="flex-1 bg-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden group">
                     {activeFile.file.type.includes('image') ? (
                       <img src={activeFile.previewUrl} alt="Preview" className="max-h-full max-w-full object-contain opacity-80" />
                     ) : (
                       <div className="text-slate-800 text-center">
                         <FileText size={64} className="mx-auto mb-2 opacity-50" />
                         <p>PDF Preview Unavailable</p>
                       </div>
                     )}
                     <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setActiveFile(null)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Remove File</button>
                     </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions Toolbar */}
            {activeFile && (
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between gap-4">
                 <button 
                  onClick={handleReject}
                  className="flex-1 bg-red-950/30 text-red-500 border border-red-900 hover:bg-red-900/50 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                   <XCircle size={18} /> Reject
                 </button>
                 <button 
                  onClick={handleScrubMetadata}
                  disabled={processing || sanitised}
                  className="flex-[2] bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20"
                >
                   {processing ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                   {sanitised ? 'Scrubbing Complete' : 'Scrub Metadata & Branding'}
                 </button>
              </div>
            )}
          </div>

          {/* RIGHT: Sanitised Preview */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
             <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-400 text-sm uppercase tracking-wider flex items-center gap-2">
                <CheckCircle size={16} /> RZ Output Preview
              </span>
              {sanitised && <span className="text-xs text-emerald-500 font-bold font-mono">READY FOR RELEASE</span>}
            </div>

            <div className="flex-1 p-6 bg-slate-900/30 flex items-center justify-center relative">
               {!sanitised ? (
                 <div className="text-center text-slate-600">
                    <Wand2 size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Processed document will appear here</p>
                 </div>
               ) : (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="w-full h-full bg-white rounded shadow-2xl relative overflow-hidden flex flex-col"
                 >
                    {/* Branding Overlay */}
                    <div className="absolute top-0 right-0 p-4 z-10 opacity-80">
                       <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/af5e0a02dff3035a8a77b159ee380a24.png" alt="RZ" className="h-12 object-contain" />
                    </div>
                    <div className="absolute bottom-4 left-4 z-10 text-[10px] text-gray-400 font-mono">
                       RZ-QC-VERIFIED • {new Date().toLocaleDateString()}
                    </div>
                    
                    {/* Content Mock */}
                    <div className="flex-1 p-8 opacity-20 flex items-center justify-center">
                       <p className="text-4xl font-black text-gray-300 -rotate-12">SANITIZED CONTENT</p>
                    </div>
                 </motion.div>
               )}
            </div>

            {/* Release Action */}
             <div className="p-4 border-t border-slate-800 bg-slate-950">
               <button 
                  onClick={handleRelease}
                  disabled={!sanitised}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                   <span>Release to Vault</span>
                   <ArrowRight size={18} />
                 </button>
             </div>
          </div>
        </div>
      </div>
    </ControlCentreLayout>
  );
};

export default SanitisationEngine;