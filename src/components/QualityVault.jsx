import React from 'react';
import { FileCheck, Download, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';

const QualityVault = ({ documents }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileCheck className="text-slate-600 w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">Quality Vault Empty</h3>
        <p className="text-slate-500">No certified documents have been released yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="text-emerald-500" />
            Quality Vault
          </h2>
          <p className="text-sm text-slate-500 mt-1">Certified RZ documentation archive</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <th className="p-4">Document</th>
              <th className="p-4">Date Certified</th>
              <th className="p-4">Size</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-900/50 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-950/30 rounded-lg text-emerald-500">
                      <FileCheck size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{doc.sanitised_filename || doc.original_filename}</p>
                      <span className="text-xs text-emerald-500 font-mono">RZ-VERIFIED</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {doc.created_at ? format(new Date(doc.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </div>
                </td>
                <td className="p-4 text-slate-400 font-mono text-xs">
                  {/* Mock size if not available */ "2.4 MB"}
                </td>
                <td className="p-4 text-center">
                  <button className="text-orange-400 hover:text-orange-300 hover:bg-orange-950/30 p-2 rounded-lg transition-all flex items-center gap-2 mx-auto text-xs font-bold uppercase tracking-wider border border-transparent hover:border-orange-500/30">
                    <Download size={14} /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QualityVault;