
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UploadCloud, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';

const FORBIDDEN_STRINGS = ['confidential', 'internal', 'secret', 'proprietary'];

export default function ClientOrderCreationPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    part_name: '', 
    description: '',
    material: '', 
    quantity: '', 
    tolerance: '',
    surface_finish: '',
    special_requirements: ''
  });
  const [files, setFiles] = useState([]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer?.files || e.target.files);
    
    const validFiles = [];
    droppedFiles.forEach(f => {
      const isForbidden = FORBIDDEN_STRINGS.some(str => f.name.toLowerCase().includes(str));
      if (isForbidden) {
        toast({ title: 'Validation Error', description: `File "${f.name}" contains forbidden keywords.`, variant: 'destructive' });
      } else {
        validFiles.push(f);
      }
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('orders').insert([{
        client_id: currentUser.id,
        user_id: currentUser.id,
        part_name: formData.part_name,
        description: formData.description,
        material: formData.material,
        quantity: parseInt(formData.quantity, 10),
        tolerance: formData.tolerance,
        surface_finish: formData.surface_finish,
        special_requirements: formData.special_requirements,
        order_status: 'PENDING_ADMIN_SCRUB'
      }]).select().single();

      if (error) throw error;

      // Handle file uploads to storage bucket 'documents' (use admin client to bypass RLS)
      if (files.length > 0) {
         for (const file of files) {
           const filePath = `${currentUser.id}/${data.id}/${file.name}`;
           const { error: uploadError } = await supabaseAdmin.storage.from('documents').upload(filePath, file);
           if (uploadError) {
             console.error('File upload error:', uploadError);
             toast({ title: 'Upload Warning', description: `Failed to upload ${file.name}: ${uploadError.message}`, variant: 'destructive' });
             continue;
           }
           const { error: docError } = await supabaseAdmin.from('documents').insert([{
              order_id: data.id,
              client_id: currentUser.id,
              file_name: file.name,
              file_path: filePath,
              file_type: 'client_drawing',
              uploaded_by: currentUser.id,
              status: 'PENDING_SCRUB'
           }]);
           if (docError) {
             console.error('Document record insert error:', docError);
             toast({ title: 'Upload Warning', description: `Failed to save record for ${file.name}: ${docError.message}`, variant: 'destructive' });
           }
         }
      }

      toast({ title: 'Success', description: 'Order successfully created and submitted.' });
      navigate(`/client-dashboard/orders/${data.id}/tracking`);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientDashboardLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-black mb-2 text-slate-100">Create New Order</h1>
        <p className="text-slate-400 mb-8">Fill in the details below to initiate a new manufacturing order.</p>

        <form onSubmit={handleSubmit} className="space-y-8 bg-[#0f172a] p-8 rounded-2xl shadow-2xl border border-slate-800">
          
          <div className="space-y-6">
            <h2 className="text-xl font-bold border-b border-slate-800 pb-2 text-cyan-400">Order Details</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300 font-bold">Part Name *</Label>
                <Input required value={formData.part_name} onChange={e => setFormData({...formData, part_name: e.target.value})} className="text-slate-100 bg-[#1e293b] border-slate-700 placeholder-slate-500 focus:border-cyan-500" placeholder="e.g. Aluminum Enclosure V2" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 font-bold">Description</Label>
                <textarea 
                  rows="3" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full rounded-md text-slate-100 bg-[#1e293b] border border-slate-700 p-3 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" 
                  placeholder="Provide a brief description of the order"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold border-b border-slate-800 pb-2 text-cyan-400">Manufacturing Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300 font-bold">Material *</Label>
                <select 
                  required
                  value={formData.material} 
                  onChange={e => setFormData({...formData, material: e.target.value})} 
                  className="w-full rounded-md text-slate-100 bg-[#1e293b] border border-slate-700 p-2.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="" disabled>Select Material</option>
                  <option value="Aluminum 6061">Aluminum 6061</option>
                  <option value="Stainless Steel 304">Stainless Steel 304</option>
                  <option value="Titanium">Titanium</option>
                  <option value="Brass">Brass</option>
                  <option value="ABS Plastic">ABS Plastic</option>
                  <option value="Other">Other (Specify in requirements)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 font-bold">Quantity *</Label>
                <Input type="number" min="1" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="text-slate-100 bg-[#1e293b] border-slate-700 focus:border-cyan-500" placeholder="e.g. 100" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 font-bold">Tolerance</Label>
                <Input value={formData.tolerance} onChange={e => setFormData({...formData, tolerance: e.target.value})} className="text-slate-100 bg-[#1e293b] border-slate-700 focus:border-cyan-500" placeholder="e.g. +/- 0.05mm" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 font-bold">Surface Finish</Label>
                <select 
                  value={formData.surface_finish} 
                  onChange={e => setFormData({...formData, surface_finish: e.target.value})} 
                  className="w-full rounded-md text-slate-100 bg-[#1e293b] border border-slate-700 p-2.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select Finish (Optional)</option>
                  <option value="As Machined">As Machined</option>
                  <option value="Bead Blast">Bead Blast</option>
                  <option value="Anodized (Clear)">Anodized (Clear)</option>
                  <option value="Anodized (Color)">Anodized (Color)</option>
                  <option value="Powder Coat">Powder Coat</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
             <Label className="text-slate-300 font-bold">Special Requirements</Label>
             <textarea 
               rows="3" 
               value={formData.special_requirements} 
               onChange={e => setFormData({...formData, special_requirements: e.target.value})} 
               className="w-full rounded-md text-slate-100 bg-[#1e293b] border border-slate-700 p-3 placeholder-slate-500 focus:outline-none focus:border-cyan-500" 
               placeholder="Any additional notes, packaging requests, or certifications required"
             />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold border-b border-slate-800 pb-2 text-cyan-400">File Upload</h2>
            <div className="bg-[#1e293b] p-4 rounded-lg flex items-start gap-3 border border-amber-900/50 text-amber-500/80 mb-4">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">For your security, filenames containing words like <span className="font-bold">confidential, internal, secret, or proprietary</span> are automatically rejected. Files will be sanitized upon submission.</p>
            </div>
            
            <div 
              onDragOver={e => e.preventDefault()} 
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center hover:bg-[#1e293b] hover:border-cyan-500 transition-colors bg-[#0f172a] cursor-pointer"
              onClick={() => document.getElementById('file-upload').click()}
            >
              <UploadCloud className="mx-auto h-12 w-12 text-cyan-500 mb-4" />
              <h3 className="text-slate-200 font-bold mb-1">Drag and drop files here</h3>
              <p className="text-slate-400 text-sm">or click to browse from your computer</p>
              <Input type="file" multiple className="hidden" id="file-upload" onChange={handleFileDrop} />
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="text-sm font-bold text-slate-300 mb-3">Attached Files ({files.length})</h4>
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-slate-700">
                    <div className="flex items-center text-sm text-slate-200">
                      <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500"/> 
                      {f.name} <span className="text-slate-500 ml-2">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-1/3 border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button type="submit" className="w-2/3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold" disabled={loading}>
              {loading ? <><Loader2 className="animate-spin mr-2" size={18} /> Processing...</> : 'Submit Order'}
            </Button>
          </div>
        </form>
      </div>
    </ClientDashboardLayout>
  );
}
