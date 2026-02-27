import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { useClientDocuments } from '@/contexts/ClientContext';
import { Search, Filter, FileText, Download, Eye, ShieldCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import SecurePDFViewer from '@/components/SecurePDFViewer';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const QualityVaultPage = () => {
  const { documents, loading, error } = useClientDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = (doc.file_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    // In real app, filter by doc type if column exists
    return matchesSearch;
  });

  return (
    <ClientDashboardLayout>
      <Helmet><title>Quality Vault - Client Portal</title></Helmet>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={32} />
            Quality Vault
          </h1>
          <p className="text-slate-400">Secure repository for your certified quality documentation.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
        ) : filteredDocs.length === 0 ? (
           <div className="text-center py-20 bg-[#0f172a] border border-slate-800 rounded-xl">
              <FileText size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No certified documents found.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-900 rounded-lg text-emerald-500">
                    <FileText size={24} />
                  </div>
                  <span className="px-2 py-1 bg-emerald-950/30 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-900/50 rounded">
                    Certified
                  </span>
                </div>
                
                <h3 className="text-slate-200 font-bold truncate mb-1" title={doc.file_name}>{doc.file_name}</h3>
                <p className="text-xs text-slate-500 font-mono mb-6">
                  {doc.created_at ? format(new Date(doc.created_at), 'MMM dd, yyyy') : ''} • {doc.file_size || 'PDF'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 py-2 rounded-lg text-xs font-bold border border-slate-700 transition-colors">
                        <Eye size={14} /> View
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl bg-transparent border-none p-0">
                      <SecurePDFViewer document={doc} />
                    </DialogContent>
                  </Dialog>
                  
                  <button 
                    onClick={() => alert("Downloading secure file...")}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-emerald-900/20"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default QualityVaultPage;