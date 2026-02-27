import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { GitPullRequest, Send, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { logInfo, logError } from '@/lib/logger';

const TenderingPage = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReadyProjects = async () => {
     logInfo('Tendering', 'Fetching projects ready for tender');
     try {
       const { data, err } = await supabase
         .from('projects')
         .select('id, client_id, project_name, project_code, status, client:client_id(company_name)')
         .eq('status', 'intake_complete');
         
       if (err) throw err;
       logInfo('Tendering', 'Fetched projects', { count: data?.length });
       setProjects(data || []);
     } catch (err) {
       logError('Tendering', 'Fetch failed', err);
       setError(err.message);
     } finally {
       setLoading(false);
     }
  };

  useEffect(() => { fetchReadyProjects(); }, []);

  const handleReleaseToMarket = async (projectId) => {
     if(!confirm("Release ghost spec to authorized suppliers?")) return;
     logInfo('Tendering', `Releasing tender for project ${projectId}`);
     
     try {
        const { error: projError } = await supabase.from('projects').update({ status: 'tendering_active' }).eq('id', projectId);
        if (projError) throw projError;
        
        const { error: tenderError } = await supabase.from('tender_requests').insert({
           project_id: projectId,
           status: 'open',
           deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
        if (tenderError) throw tenderError;
        
        logInfo('Tendering', 'Tender released successfully');
        toast({ title: "Tender Released", description: "Suppliers have been notified." });
        fetchReadyProjects();
     } catch(e) {
        logError('Tendering', 'Release failed', e);
        toast({ title: "RZ Global Solutions Error", description: e.message, variant: "destructive" });
     }
  };

  return (
    <ControlCentreLayout>
      <Helmet><title>Tendering Command - Admin</title></Helmet>
      
      <div className="mb-8">
         <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-2">
            <GitPullRequest className="text-sky-500" size={32} />
            Tendering Command
         </h1>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
         {loading ? (
            <div className="flex flex-col items-center justify-center p-16">
               <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 mb-4 animate-pulse" />
               <Loader2 className="animate-spin text-sky-500 w-8 h-8 mb-2" />
               <p className="text-slate-400 font-medium">RZ Global Solutions is preparing tenders...</p>
            </div>
         ) : error ? (
            <div className="p-16 flex flex-col items-center text-red-400 gap-4">
               <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 opacity-50 grayscale" />
               <div className="flex items-center gap-2 text-lg font-bold">
                 <AlertCircle size={24} /> RZ Global Solutions Error
               </div>
               <p>{error}</p>
            </div>
         ) : projects.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No projects ready for tendering. Check Intake Gate.</div>
         ) : (
            <table className="w-full text-left">
               <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                  <tr><th className="p-4">Project Code</th><th className="p-4 text-right">Action</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-800 text-slate-300">
                  {projects.map(p => (
                     <tr key={p.id}>
                        <td className="p-4 font-mono font-bold text-white">{p.project_code}</td>
                        <td className="p-4 text-right">
                           <button onClick={() => handleReleaseToMarket(p.id)} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-bold ml-auto">
                              Release Tender
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         )}
      </div>
    </ControlCentreLayout>
  );
};

export default TenderingPage;