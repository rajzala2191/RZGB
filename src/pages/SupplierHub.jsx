import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useSupplierOrders } from '@/contexts/SupplierContext';
import { Package, Upload, Printer, DollarSign, LogOut, Loader2, CheckCircle, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { createAuditLog } from '@/lib/auditLogger';
import { useNavigate } from 'react-router-dom';

const SupplierHub = () => {
  const { currentUser, userCompanyName, logout } = useAuth();
  const { orders, loading, error, refreshData } = useSupplierOrders();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans">
      <Helmet>
        <title>Supplier Hub - RZ Global Solutions</title>
      </Helmet>

      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Package className="text-sky-500 h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold tracking-wide">SUPPLIER COMMAND</h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{userCompanyName || 'Authorized Partner'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-950/30 text-red-500 border border-red-900 hover:bg-red-900/50 px-4 py-2 rounded-lg text-sm font-bold transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-sky-500 w-10 h-10" />
          </div>
        ) : error ? (
           <div className="bg-red-900/20 text-red-400 p-4 rounded-lg">Error: {error}</div>
        ) : (
          <div className="grid gap-6">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Active Assignments</h2>
            
            {orders.length === 0 ? (
               <div className="p-12 text-center text-slate-500 bg-[#0f172a] rounded-xl border border-slate-800">
                 No active assignments found.
               </div>
            ) : (
              orders.map(order => (
                <OrderCard key={order.id} order={order} userId={currentUser?.id} onSuccess={refreshData} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const OrderCard = ({ order, userId, onSuccess }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [docUploaded, setDocUploaded] = useState(false); // Local state for demo, normally check order.has_qc_doc

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    // Simulate upload delay
    setTimeout(async () => {
      setUploading(false);
      setDocUploaded(true);
      
      // Log audit
      await createAuditLog({
        userId,
        action: 'QC_UPLOAD',
        orderId: order.rz_id,
        details: `Uploaded QC Document: ${acceptedFiles[0].name}`,
        status: 'success'
      });

      toast({
        title: "QC Document Uploaded",
        description: "Shipping & Payment controls enabled.",
        className: "bg-emerald-600 border-emerald-700 text-white"
      });
      
      if(onSuccess) onSuccess();
    }, 1500);
  }, [order, userId, toast, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png']},
    maxFiles: 1,
    disabled: docUploaded
  });

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col lg:flex-row gap-6">
      {/* Order Info */}
      <div className="flex-1">
        <div className="flex items-start justify-between mb-4">
           <div>
              <span className="text-xs text-sky-500 font-bold uppercase tracking-wider mb-1 block">Work Order</span>
              <h3 className="text-3xl font-mono text-white font-bold">{order.rz_id}</h3>
           </div>
           <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
             order.status === 'completed' ? 'bg-emerald-950 text-emerald-500 border-emerald-900' : 
             'bg-sky-950 text-sky-500 border-sky-900'
           }`}>
             {order.status}
           </div>
        </div>
        
        {/* Actions - Disabled until upload */}
        <div className="flex gap-4 mt-6">
           <TooltipButton 
             icon={Printer} 
             label="Print Shipping Label" 
             disabled={!docUploaded} 
             tooltip="Upload QC document to enable" 
             color="bg-slate-800 text-slate-200 hover:bg-slate-700"
           />
           <TooltipButton 
             icon={DollarSign} 
             label="Request Payment" 
             disabled={!docUploaded} 
             tooltip="Upload QC document to enable" 
             color="bg-emerald-600 text-white hover:bg-emerald-500"
           />
        </div>
      </div>

      {/* Upload Zone */}
      <div className="flex-1 lg:max-w-md">
        <div 
          {...getRootProps()} 
          className={`h-full min-h-[150px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden
            ${docUploaded 
               ? 'border-emerald-500 bg-emerald-950/20' 
               : isDragActive 
                 ? 'border-sky-500 bg-sky-900/10' 
                 : 'border-slate-700 hover:border-sky-500 hover:bg-slate-900/30'
            }
          `}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="flex flex-col items-center animate-pulse">
               <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-2" />
               <p className="text-sky-500 font-bold">Uploading QC Data...</p>
            </div>
          ) : docUploaded ? (
            <div className="flex flex-col items-center text-emerald-500">
               <CheckCircle className="w-12 h-12 mb-2" />
               <p className="font-bold">QC Verification Complete</p>
               <p className="text-xs text-emerald-400 mt-1">Upload timestamp logged</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-400 p-6 text-center">
               <Upload className="w-10 h-10 mb-3" />
               <p className="font-bold text-slate-200">Upload Quality Control Proof</p>
               <p className="text-xs mt-1">PDF, JPG, or PNG required to proceed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TooltipButton = ({ icon: Icon, label, disabled, tooltip, color }) => (
  <div className="relative group">
    <button 
      disabled={disabled}
      className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold transition-all ${
        disabled ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800' : color
      }`}
    >
      <Icon size={18} /> {label}
    </button>
    {disabled && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-slate-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none">
        {tooltip}
      </div>
    )}
  </div>
);

export default SupplierHub;