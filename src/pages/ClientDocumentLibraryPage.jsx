import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Download, FileText, Eye, Loader2, Library } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { DocumentPreviewModal } from '@/components/DocumentPreview';

const ClientDocumentLibraryPage = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter] = useState('all');
  const [previewDoc, setPreviewDoc] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocs = async () => {
      if (!currentUser) return;
      try {
        // Fetch documents by client_id
        const { data: byClient, error: err1 } = await supabase
          .from('documents')
          .select('*')
          .eq('client_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (err1) throw err1;
        let allDocs = byClient || [];

        // Also fetch the client's orders and find documents by order_id
        const { data: clientOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('client_id', currentUser.id);

        const orderIds = (clientOrders || []).map(o => o.id).filter(Boolean);
        if (orderIds.length > 0) {
          const { data: byOrder } = await supabaseAdmin
            .from('documents')
            .select('*')
            .in('order_id', orderIds)
            .order('created_at', { ascending: false });

          if (byOrder) {
            const existingIds = new Set(allDocs.map(d => d.id));
            byOrder.forEach(doc => {
              if (!existingIds.has(doc.id)) allDocs.push(doc);
            });
          }
        }

        // Clients should not see supplier submissions that haven't been approved yet
        const visibleDocs = allDocs.filter(doc => {
          if (doc.file_type === 'supplier_submission') {
            return doc.status === 'approved' || doc.status === 'sent_to_client';
          }
          return true;
        });
        setDocuments(visibleDocs);
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to load document library", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [currentUser]);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = (doc.file_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || (doc.file_type || 'other') === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleBulkDownload = () => {
    toast({ title: "Bulk Download", description: "Preparing ZIP archive..." });
    // Implementation would require a server function to zip files
  };

  const handleExportCSV = () => {
    const csv = "File Name,Type,Created At,Status\n" + 
      filteredDocs.map(d => `${d.file_name},${d.file_type || 'PDF'},${d.created_at},${d.status}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <ClientDashboardLayout>
      <Helmet><title>Document Library - Client Portal</title></Helmet>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
              <Library className="text-orange-500" size={32} />
              Document Library
           </h1>
           <p className="text-slate-400 mt-1">Central repository for all order files.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportCSV} className="px-4 py-2 bg-slate-800 rounded-lg text-slate-300 border border-slate-700 hover:text-white transition-colors">
              Export List
           </button>
           <button onClick={handleBulkDownload} className="px-4 py-2 bg-orange-600 rounded-lg text-white font-bold hover:bg-orange-500 transition-colors flex items-center gap-2">
              <Download size={16} /> Download All (ZIP)
           </button>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex gap-4 mb-6">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-orange-500"
            />
         </div>
      </div>

      {loading ? (
         <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
      ) : filteredDocs.length === 0 ? (
         <div className="text-center py-12 text-slate-500">No documents found.</div>
      ) : (
         <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                  <tr>
                     <th className="p-4">File Name</th>
                     <th className="p-4">Type</th>
                     <th className="p-4">Upload Date</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                  {filteredDocs.map(doc => (
                     <tr key={doc.id} className="hover:bg-slate-900/50">
                        <td className="p-4 text-slate-200 font-medium flex items-center gap-2">
                           <FileText size={16} className="text-slate-500" /> {doc.file_name}
                        </td>
                        <td className="p-4 text-slate-400 uppercase text-xs">{doc.file_type || 'PDF'}</td>
                        <td className="p-4 text-slate-400 font-mono text-sm">{format(new Date(doc.created_at), 'MMM dd, yyyy')}</td>
                        <td className="p-4">
                           <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700">
                              {doc.status || 'Active'}
                           </span>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                           <button 
                              onClick={() => setPreviewDoc(doc)}
                              className="p-2 hover:bg-orange-900/30 text-orange-400 rounded transition-colors"
                           >
                              <Eye size={16} />
                           </button>
                           <button className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"><Download size={16} /></button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={!!previewDoc}
        onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}
        filePath={previewDoc?.file_path}
        fileName={previewDoc?.file_name}
        fileUrl={previewDoc?.file_url}
      />
    </ClientDashboardLayout>
  );
};

export default ClientDocumentLibraryPage;