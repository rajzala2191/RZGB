import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, FileText, FileImage, FolderOpen, Eye } from 'lucide-react';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { DocumentPreviewModal } from '@/components/DocumentPreview';

export default function SupplierDocumentsPortal() {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, [currentUser]);

  const fetchDocuments = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('documents')
      .select('*')
      .or(`uploaded_by.eq.${currentUser.id},supplier_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });
    if (data) setDocuments(data);
  };

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return <FileText className="text-red-400" />;
    if (type?.includes('image')) return <FileImage className="text-orange-400" />;
    return <FileText className="text-slate-400" />;
  };

  const filteredDocs = documents.filter(d => d.file_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <SupplierHubLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Document Portal</h1>
            <p className="text-slate-400">Access technical drawings, QC reports, and shipping labels.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <Input 
              placeholder="Search documents..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#0f172a] border-slate-800 text-slate-200"
            />
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-xl shadow-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e293b] border-b border-slate-800 text-slate-300">
              <tr>
                <th className="p-4">Document</th>
                <th className="p-4">Type</th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Upload Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-700">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <span className="font-medium text-slate-200 group-hover:text-orange-400 transition-colors">{doc.file_name}</span>
                  </td>
                  <td className="p-4 text-slate-400 uppercase text-xs font-semibold">{(doc.file_type || 'General').replace(/_/g, ' ')}</td>
                  <td className="p-4 font-mono text-xs text-slate-500">{doc.order_id?.slice(0,8) || 'N/A'}</td>
                  <td className="p-4 text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-orange-500 hover:text-orange-400 hover:bg-orange-900/20"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-300 hover:bg-slate-800">
                        <Download size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    <FolderOpen size={48} className="mx-auto mb-4 text-slate-700" />
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Document Preview Modal */}
        <DocumentPreviewModal
          open={!!previewDoc}
          onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}
          filePath={previewDoc?.file_path}
          fileName={previewDoc?.file_name}
          fileUrl={previewDoc?.file_url}
        />
      </div>
    </SupplierHubLayout>
  );
}