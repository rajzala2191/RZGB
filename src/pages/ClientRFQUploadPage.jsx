import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { UploadCloud, FileText, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { logInfo, logError } from '@/lib/logger';

const ClientRFQUploadPage = () => {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(orderId || '');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
       if(!currentUser) return;
       logInfo('RFQUpload', 'Fetching client orders for dropdown');
       try {
          const { data, error } = await supabase.from('orders').select('id, part_name, ghost_public_name').eq('client_id', currentUser.id);
          if (error) throw error;
          setOrders(data || []);
       } catch (error) {
          logError('RFQUpload', 'Failed to fetch orders', error);
       }
    };
    fetchOrders();
  }, [currentUser]);

  const onDrop = (acceptedFiles) => {
     if (acceptedFiles?.length) setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  const handleUpload = async () => {
    if (!file || !selectedOrder) {
       toast({ title: "Validation Error", description: "Please select an order and a file.", variant: "destructive" });
       return;
    }

    setUploading(true);
    const workflow = 'RFQUpload';
    logInfo(workflow, 'Starting file upload process', { fileName: file.name, fileSize: file.size, order: selectedOrder });

    try {
       const filePath = `rfqs/${currentUser.id}/${Date.now()}_${file.name}`;
       
       const payload = {
          order_id: selectedOrder,
          client_id: currentUser.id,
          uploaded_by: currentUser.id,
          file_name: file.name,
          file_path: filePath,
          file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          file_type: 'rfq',
          status: 'pending'
       };

       logInfo(workflow, 'Inserting document record', payload);
       const { error: dbError } = await supabase.from('documents').insert(payload);

       if (dbError) throw dbError;

       logInfo(workflow, 'Logging audit action');
       await supabase.from('audit_logs').insert({
          admin_id: currentUser.id,
          action: 'RFQ_UPLOADED',
          details: `Uploaded RFQ for order ${selectedOrder}`,
          status: 'success'
       });

       toast({ title: "RFQ Uploaded", description: "Your document is now in the intake queue." });
       navigate('/client-dashboard/orders');

    } catch (err) {
       logError(workflow, 'Upload failed', err);
       toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
       setUploading(false);
    }
  };

  return (
    <ClientDashboardLayout>
       <Helmet><title>Upload RFQ - Client Portal</title></Helmet>
       <div className="max-w-2xl mx-auto mt-8">
          <div className="mb-8 text-center">
             <h1 className="text-3xl font-bold text-slate-100 mb-2">Upload Request for Quote</h1>
          </div>
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8">
             <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Order</label>
                <select 
                   value={selectedOrder}
                   onChange={e => setSelectedOrder(e.target.value)}
                   className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100"
                >
                   <option value="">-- Select Order --</option>
                   {orders.map(o => <option key={o.id} value={o.id}>{o.ghost_public_name || o.part_name || o.id.slice(0, 8)}</option>)}
                </select>
             </div>
             <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors mb-6 ${
                   isDragActive ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-700 hover:border-slate-500'
                }`}
             >
                <input {...getInputProps()} />
                {file ? (
                   <div className="flex flex-col items-center">
                      <FileText size={48} className="text-cyan-500 mb-2" />
                      <p className="text-slate-200 font-bold">{file.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="mt-4 text-xs text-red-400">Remove</button>
                   </div>
                ) : (
                   <div className="flex flex-col items-center">
                      <UploadCloud size={48} className="text-slate-500 mb-2" />
                      <p className="text-slate-300">Drag & drop your RFQ package here</p>
                   </div>
                )}
             </div>
             <button 
                onClick={handleUpload}
                disabled={uploading || !file || !selectedOrder}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
             >
                {uploading ? <Loader2 className="animate-spin" /> : <UploadCloud size={20} />}
                Submit RFQ
             </button>
          </div>
       </div>
    </ClientDashboardLayout>
  );
};

export default ClientRFQUploadPage;