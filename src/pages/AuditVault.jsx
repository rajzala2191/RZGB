import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Search, Filter, Database, Download, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuditLogs } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';

const AuditVault = () => {
  const { auditLogs, loading, error, refreshData } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    supabase.from('profiles').select('id, email, company_name').then(({data}) => {
      if (data) {
        setProfiles(data.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}));
      }
    });
  }, []);

  const filteredLogs = auditLogs.filter(log => {
    const searchString = searchTerm.toLowerCase();
    const adminEmail = profiles[log.admin_id]?.email || '';
    const matchesSearch = 
      adminEmail.toLowerCase().includes(searchString) ||
      (log.action || '').toLowerCase().includes(searchString) ||
      (typeof log.details === 'string' && log.details.toLowerCase().includes(searchString)) ||
      (log.order_id || '').toLowerCase().includes(searchString);
      
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    let matchesDate = true;
    if (log.created_at) {
      const logDate = new Date(log.created_at);
      if (dateRange.start) {
        matchesDate = matchesDate && logDate >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        matchesDate = matchesDate && logDate <= new Date(dateRange.end + 'T23:59:59');
      }
    }
    
    return matchesSearch && matchesAction && matchesDate;
  });

  const handleExport = () => {
     try {
       const headers = "Timestamp,User,Action,Order ID,Details,Status\n";
       const rows = filteredLogs.map(log => 
         `${log.created_at},${profiles[log.admin_id]?.email || 'System'},${log.action},${log.order_id || ''},"${(log.details || '').toString().replace(/"/g, '""')}",${log.status}`
       ).join("\n");
       
       const blob = new Blob([headers + rows], { type: 'text/csv' });
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `audit_vault_${Date.now()}.csv`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
     } catch(e) {
       console.error("Export error", e);
     }
  };

  const getActionColor = (action) => {
    if (!action) return 'text-slate-400';
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('FAILED')) return 'text-red-400';
    if (action.includes('RELEASE') || action.includes('UPLOAD') || action.includes('SUCCESS')) return 'text-emerald-400';
    return 'text-sky-400';
  };

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>Audit Vault - RZ Global Solutions</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
              <Database className="text-sky-500" size={32} />
              Audit Vault
            </h1>
            <p className="text-slate-400 mt-1">Immutable ledger of all system transactions.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={refreshData}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg font-medium transition-colors"
            >
              <RefreshCw size={18} />
            </button>
            <button 
               onClick={handleExport}
               className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Download size={18} /> Export Log
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by User, Action, Order ID, or Details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
            />
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter size={18} className="text-slate-500" />
            <select 
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="PROCESS_RFQ">Process RFQ</option>
              <option value="DOCUMENT_UPLOAD">Upload</option>
              <option value="METADATA_SCRUB">Sanitisation</option>
              <option value="DOCUMENT_RELEASE">Release</option>
              <option value="DOCUMENT_REJECT">Reject</option>
              <option value="ORDER_CREATED">Order Created</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
            />
            <span className="text-slate-500">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl flex flex-col items-center text-red-200 gap-4">
            <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-12 h-12 grayscale opacity-60" />
            <div className="flex items-center gap-2 font-bold"><AlertCircle /> RZ Global Solutions Error</div>
            <p>Error loading audit logs: {error}</p>
            <Button variant="outline" className="mt-2 border-red-500 text-red-400 hover:bg-red-950" onClick={refreshData}>
              Retry Fetching Logs
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-16">
               <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 mb-4 animate-pulse" />
               <Loader2 className="animate-spin text-sky-500 w-8 h-8 mb-2" />
               <p className="text-slate-400 font-medium">RZ Global Solutions is loading vault data...</p>
             </div>
          ) : !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm font-mono">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 text-slate-400 whitespace-nowrap">
                          {log.created_at ? format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                        </td>
                        <td className="p-4 text-slate-200">
                          {profiles[log.admin_id]?.email || log.admin_id || 'System / Automated'}
                        </td>
                        <td className={`p-4 font-bold ${getActionColor(log.action)}`}>
                          {log.action}
                        </td>
                        <td className="p-4 text-slate-400 truncate max-w-xs" title={typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}>
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                        </td>
                        <td className="p-4">
                          {log.status === 'success' ? (
                            <span className="text-emerald-500 flex items-center gap-1 text-xs uppercase font-bold">● Success</span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1 text-xs uppercase font-bold">● Failed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 font-sans">
                        No audit records found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ControlCentreLayout>
  );
};

export default AuditVault;