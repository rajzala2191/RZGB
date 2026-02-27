import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Search, Filter, ArrowUpRight, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const NCRVisibilityPage = () => {
  const { currentUser } = useAuth();
  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchNCRs = async () => {
      if (!currentUser) return;
      // Fetch NCRs linked to client's orders where client_notified is true
      // This requires a join or a specific RLS policy that allows clients to see these rows
      const { data, error } = await supabase
        .from('ncr_reports')
        .select('*, order:order_id(rz_job_id, project_id)')
        .eq('client_notified', true)
        .order('created_at', { ascending: false });

      if (data) setNcrs(data);
      setLoading(false);
    };

    fetchNCRs();
  }, [currentUser]);

  const filteredNCRs = ncrs.filter(ncr => 
    (ncr.order?.rz_job_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ncr.issue_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ClientDashboardLayout>
      <Helmet><title>NCR Visibility - Client Portal</title></Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2 text-amber-500 flex items-center gap-2">
           <AlertTriangle size={32} />
           NCR Visibility
        </h1>
        <p className="text-slate-400">Transparency report on non-conformance and resolution actions.</p>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 mb-6">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search issues by Job ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
         </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading reports...</div>
      ) : filteredNCRs.length === 0 ? (
        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-12 text-center">
           <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
           <h3 className="text-xl font-bold text-emerald-400">All Clear</h3>
           <p className="text-emerald-500/70 mt-2">No active non-conformance reports requiring your attention.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNCRs.map(ncr => (
            <div key={ncr.id} className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 relative overflow-hidden">
               <div className={`absolute left-0 top-0 bottom-0 w-1 ${ncr.severity === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
               
               <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                     <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-slate-300 font-bold">{ncr.order?.rz_job_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                           ncr.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-amber-950 text-amber-400 border border-amber-900'
                        }`}>
                           {ncr.severity} Severity
                        </span>
                     </div>
                     <h3 className="text-lg font-bold text-white">{ncr.issue_type}</h3>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                     Reported: {format(new Date(ncr.created_at), 'MMM dd, yyyy')}
                  </div>
               </div>
               
               <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 mb-4">
                  <p className="text-sm text-slate-400">{ncr.description}</p>
               </div>

               <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500 font-bold">RZ Resolution:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                     <CheckCircle size={14} />
                     {ncr.admin_decision || 'Pending Review'}
                  </span>
               </div>
            </div>
          ))}
        </div>
      )}
    </ClientDashboardLayout>
  );
};

export default NCRVisibilityPage;