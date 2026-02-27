import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Activity, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SupplierHubLayout from '@/components/SupplierHubLayout';

export default function SupplierAwardedJobsPage() {
  const [jobs, setJobs] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, [currentUser]);

  const fetchJobs = async () => {
    if (!currentUser) return;
    const { data } = await supabase.from('orders')
      .select('*')
      .eq('supplier_id', currentUser.id)
      .in('order_status', ['AWARDED', 'IN_PRODUCTION', 'QC_PENDING', 'COMPLETED'])
      .order('updated_at', { ascending: false });
    if (data) setJobs(data);
  };

  return (
    <SupplierHubLayout>
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-slate-100">Awarded Production Jobs</h1>
          <p className="text-slate-400">Manage jobs you have won and are currently manufacturing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
            <div key={job.id} className="bg-[#0f172a] rounded-xl shadow-xl border border-slate-800 p-6 flex flex-col group hover:border-cyan-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">{job.ghost_public_name}</h3>
                  <p className="font-mono text-xs text-slate-500 mt-1">ID: {job.id.slice(0, 8)}</p>
                </div>
                <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-800 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                  {job.order_status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-2 mb-6 flex-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Material:</span><span className="text-slate-200">{job.material}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Quantity:</span><span className="text-slate-200">{job.quantity}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Awarded Value:</span><span className="font-semibold text-emerald-400">${job.buy_price}</span></div>
              </div>

              <div className="flex gap-3 mt-auto">
                <Button onClick={() => navigate(`/supplier-hub/jobs/${job.rz_job_id || job.id}`)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                  <Activity size={16} className="mr-2" /> Progress
                </Button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="col-span-full p-12 text-center border border-slate-800 rounded-xl bg-[#0f172a]">
              <Package size={48} className="mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">You don't have any active production jobs yet.</p>
            </div>
          )}
        </div>
      </div>
    </SupplierHubLayout>
  );
}