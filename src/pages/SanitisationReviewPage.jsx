import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CheckSquare, FileText } from 'lucide-react';

import ControlCentreLayout from '@/components/ControlCentreLayout';
import DocumentPreview from '@/components/DocumentPreview';
import { scrubDrawingWithAI } from '@/lib/aiScrubber';

export default function SanitisationReviewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [formData, setFormData] = useState({
    ghost_public_name: '', ghost_description: '', target_sell_price: ''
  });
  const [checks, setChecks] = useState({ files: false, identity: false, margin: false });

  useEffect(() => {
    fetchOrder();
    fetchDocuments();
  }, [orderId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('id, order_id, file_name, file_path, file_type, status, uploaded_by, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      if (!error && data) setDocuments(data);
    } catch (err) {
      console.error('Error fetching order documents:', err);
    }
  };

  const fetchOrder = async () => {
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (data) {
      setOrder(data);
      setFormData({
        ghost_public_name: `RZ-PRJ-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
        ghost_description: `Machined ${data.material || 'parts'}`,
        target_sell_price: data.buy_price ? (parseFloat(data.buy_price) * 1.2).toFixed(2) : ''
      });
    }
  };

  const handleAuthorise = async () => {
    if (!checks.files || !checks.identity || !checks.margin) {
      toast({ title: 'Validation Required', description: 'Please complete all sanitization verification checks.', variant: 'destructive' });
      return;
    }

    try {
      await supabase.from('orders').update({
        ghost_public_name: formData.ghost_public_name,
        ghost_description: formData.ghost_description,
        target_sell_price: formData.target_sell_price,
        order_status: 'SANITIZED'
      }).eq('id', orderId);

      await supabase.from('sanitization_records').insert([{
        order_id: orderId, admin_id: currentUser.id, ghost_name: formData.ghost_public_name, status: 'COMPLETED'
      }]);

      toast({ title: 'Success', description: 'Order sanitized successfully! Next: Assign a supplier.' });
      navigate('/control-centre/supplier-pool');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (!order) return <ControlCentreLayout><div className="p-8 text-slate-300">Loading...</div></ControlCentreLayout>;

  return (
    <ControlCentreLayout>
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        <h1 className="text-3xl font-bold text-slate-100">Sanitisation Review: {order.part_name}</h1>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#0f172a] p-6 rounded-lg shadow-xl border border-slate-800 space-y-4">
            <h2 className="text-xl font-semibold border-b border-slate-800 pb-2 text-slate-200">Original Data</h2>
            <p className="text-slate-300"><strong className="text-slate-400">Part:</strong> {order.part_name}</p>
            <p className="text-slate-300"><strong className="text-slate-400">Material:</strong> {order.material}</p>
            <p className="text-slate-300"><strong className="text-slate-400">Client Target Price:</strong> ${order.buy_price}</p>
            
            <div className="mt-8 pt-4 border-t border-slate-800 space-y-3">
              <h3 className="font-semibold text-slate-200">Verification Checklist</h3>
              <label className="flex items-center space-x-3 text-sm text-slate-300 cursor-pointer hover:text-slate-100">
                <input type="checkbox" checked={checks.files} onChange={e => setChecks({...checks, files: e.target.checked})} className="rounded bg-slate-800 border-slate-700" />
                <span>All files renamed to RZ-Standard format</span>
              </label>
              <label className="flex items-center space-x-3 text-sm text-slate-300 cursor-pointer hover:text-slate-100">
                <input type="checkbox" checked={checks.identity} onChange={e => setChecks({...checks, identity: e.target.checked})} className="rounded bg-slate-800 border-slate-700" />
                <span>Ghost identity and descriptions are set</span>
              </label>
              <label className="flex items-center space-x-3 text-sm text-slate-300 cursor-pointer hover:text-slate-100">
                <input type="checkbox" checked={checks.margin} onChange={e => setChecks({...checks, margin: e.target.checked})} className="rounded bg-slate-800 border-slate-700" />
                <span>Margins are calculated and locked</span>
              </label>
            </div>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-lg shadow-xl border border-slate-800 space-y-4">
            <h2 className="text-xl font-semibold border-b border-slate-800 pb-2 text-slate-200">Ghost Identity & Margins</h2>
            <div className="space-y-2">
              <Label className="text-slate-300">Ghost Public Name</Label>
              <Input value={formData.ghost_public_name} onChange={e => setFormData({...formData, ghost_public_name: e.target.value})} className="text-slate-100 bg-[#1e293b] border-slate-700 placeholder-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Ghost Description</Label>
              <Input value={formData.ghost_description} onChange={e => setFormData({...formData, ghost_description: e.target.value})} className="text-slate-100 bg-[#1e293b] border-slate-700 placeholder-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Selling Price Per Piece</Label>
              <Input type="number" value={formData.target_sell_price} onChange={e => setFormData({...formData, target_sell_price: e.target.value})} placeholder="Enter selling price per piece" className="text-slate-100 bg-[#1e293b] border-slate-700 placeholder-slate-500" />
            </div>
          </div>
        </div>

        {/* Client Uploaded Documents */}

        {documents.length > 0 && (
          <div className="bg-[#0f172a] p-6 rounded-lg shadow-xl border border-slate-800 space-y-4">
            <h2 className="text-xl font-semibold border-b border-slate-800 pb-2 text-slate-200 flex items-center gap-2">
              <FileText size={20} className="text-cyan-400" />
              Client Uploaded Documents ({documents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="relative group">
                  <DocumentPreview filePath={doc.file_path} fileName={doc.file_name} compact />
                  {/* Remove Button */}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 left-2 z-10 opacity-80 group-hover:opacity-100"
                    title="Remove document"
                    onClick={async () => {
                      if (!window.confirm('Are you sure you want to delete this document?')) return;
                      try {
                        // Remove from storage (original and scrubbed if exists)
                        await supabaseAdmin.storage.from('documents').remove([doc.file_path]);
                        if (doc.scrubbed_file_path) {
                          await supabaseAdmin.storage.from('documents').remove([doc.scrubbed_file_path]);
                        }
                        // Remove from DB
                        await supabaseAdmin.from('documents').delete().eq('id', doc.id);
                        toast({ title: 'Document Removed', description: 'The document was deleted.' });
                        fetchDocuments();
                      } catch (err) {
                        toast({ title: 'Remove Failed', description: err.message, variant: 'destructive' });
                      }
                    }}
                  >
                    Remove
                  </Button>
                  {/* AI Scrub Button */}
                  {doc.file_type === 'client_drawing' && doc.status !== 'SCRUBBED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 z-10"
                      onClick={async () => {
                        try {
                          toast({ title: 'AI Scrubbing', description: 'Scrubbing drawing with AI...', duration: 2000 });
                          // Download file from Supabase
                          const { data, error } = await supabaseAdmin.storage.from('documents').download(doc.file_path);
                          if (error) throw error;
                          // Call AI scrubber
                          const scrubbedBlob = await scrubDrawingWithAI(data);
                          // Upload scrubbed file
                          const scrubbedPath = doc.file_path.replace(/(\.[^.]+)$/, '_scrubbed$1');
                          const { error: uploadError } = await supabaseAdmin.storage.from('documents').upload(scrubbedPath, scrubbedBlob, { upsert: true });
                          if (uploadError) throw uploadError;
                          // Update document record
                          await supabaseAdmin.from('documents').update({ status: 'SCRUBBED', scrubbed_file_path: scrubbedPath }).eq('id', doc.id);
                          toast({ title: 'AI Scrubbing Complete', description: 'Drawing scrubbed and updated.' });
                          fetchDocuments();
                        } catch (err) {
                          toast({ title: 'AI Scrubbing Failed', description: err.message, variant: 'destructive' });
                        }
                      }}
                    >
                      Scrub with AI
                    </Button>
                  )}
                  {doc.status === 'SCRUBBED' && (
                    <span className="absolute top-2 right-2 z-10 bg-green-900/80 text-green-300 px-2 py-0.5 rounded text-xs font-bold">AI SCRUBBED</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleAuthorise} size="lg" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center justify-center gap-2">
          <CheckSquare size={20} />
          AUTHORISE & MARK SANITIZED
        </Button>
      </div>
    </ControlCentreLayout>
  );
}