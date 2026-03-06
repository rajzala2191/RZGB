import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import MilestoneUpdater from '@/components/MilestoneUpdater';
import AssetViewer from '@/components/AssetViewer';
import ShippingLabelGenerator from '@/components/ShippingLabelGenerator';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const JobDetailsPage = () => {
  const { rz_job_id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('rz_job_id', rz_job_id)
          .single();

        if (error) throw error;
        setJob(data);
      } catch (err) {
        console.error(err);
        setError("Job not found or access denied.");
      } finally {
        setLoading(false);
      }
    };

    if (rz_job_id) fetchJob();
  }, [rz_job_id]);

  if (loading) return (
    <SupplierHubLayout>
      <div className="flex justify-center p-20"><Loader2 className="animate-spin text-sky-500 w-10 h-10" /></div>
    </SupplierHubLayout>
  );

  if (error || !job) return (
    <SupplierHubLayout>
      <div className="text-red-400 p-8">{error}</div>
    </SupplierHubLayout>
  );

  return (
    <SupplierHubLayout>
      <Helmet><title>{`Job ${job.rz_job_id || ''} - Supplier Hub`}</title></Helmet>
      
      <div className="mb-6">
        <button onClick={() => navigate('/supplier-hub')} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 text-sm font-bold">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white font-mono tracking-tight">{job.rz_job_id}</h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              Status: <span className="text-sky-400 font-bold uppercase">{job.status}</span>
            </p>
          </div>
          <div className="flex gap-2">
             <div className={`px-4 py-2 rounded-lg font-bold text-sm border ${
               job.is_qc_approved 
                 ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400' 
                 : 'bg-amber-950/50 border-amber-500/50 text-amber-400'
             }`}>
               {job.is_qc_approved ? 'QC APPROVED' : 'QC PENDING'}
             </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Manufacturing Workflow Navigation */}
        <div className="bg-gradient-to-r from-slate-950/80 to-slate-900/80 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-sky-500/20 border border-sky-500 rounded-lg flex items-center justify-center text-sky-400 text-sm font-bold">✦</span>
            Manufacturing Workflow
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => navigate(`/supplier-hub/job-tracking/${rz_job_id}`)}
              className="p-3 rounded-lg bg-slate-800 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-blue-400 transition-all font-bold text-sm text-center"
            >
              📋 Job Tracking
            </button>
            <button
              onClick={() => navigate(`/supplier-hub/material-update/${rz_job_id}`)}
              className="p-3 rounded-lg bg-slate-800 hover:bg-orange-900/30 border border-slate-700 hover:border-orange-500 text-slate-300 hover:text-orange-400 transition-all font-bold text-sm text-center"
            >
              📦 Material Update
            </button>
            <button
              onClick={() => navigate(`/supplier-hub/casting/${rz_job_id}`)}
              className="p-3 rounded-lg bg-slate-800 hover:bg-amber-900/30 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-amber-400 transition-all font-bold text-sm text-center"
            >
              🔥 Casting
            </button>
            <button
              onClick={() => navigate(`/supplier-hub/machining/${rz_job_id}`)}
              className="p-3 rounded-lg bg-slate-800 hover:bg-purple-900/30 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-purple-400 transition-all font-bold text-sm text-center"
            >
              ⚙️ Machining
            </button>
            <button
              onClick={() => navigate(`/supplier-hub/qc/${rz_job_id}`)}
              className="p-3 rounded-lg bg-slate-800 hover:bg-emerald-900/30 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 transition-all font-bold text-sm text-center"
            >
              ✓ QC
            </button>
            <button
              onClick={() => navigate(`/supplier-hub/dispatch/${rz_job_id}`)}
              className="p-3 rounded-lg bg-slate-800 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-blue-400 transition-all font-bold text-sm text-center"
            >
              🚚 Dispatch
            </button>
          </div>
        </div>

        {/* Milestones */}
        <MilestoneUpdater 
          orderId={job.id} 
          currentMilestone={job.current_milestone} 
          onUpdate={() => window.location.reload()} 
        />

        {/* Assets (Mock Data for Demo) */}
        <AssetViewer 
          orderId={job.id}
          assets={[
            { id: 1, asset_name: 'Drawing_Rev3.pdf', asset_type: 'pdf', file_size: '2.4 MB', download_enabled: false },
            { id: 2, asset_name: 'CAD_Model.step', asset_type: 'cad', file_size: '14.2 MB', download_enabled: true }
          ]} 
        />

        {/* Shipping & NCR */}
        <div className="grid md:grid-cols-2 gap-6">
          <ShippingLabelGenerator 
            orderId={job.id} 
            isQcApproved={job.is_qc_approved} 
            rzJobId={job.rz_job_id}
          />
          
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 flex flex-col justify-center items-center text-center">
            <AlertTriangle className="text-amber-500 mb-4" size={32} />
            <h3 className="text-lg font-bold text-slate-100">Report Issue (NCR)</h3>
            <p className="text-sm text-slate-400 mt-2 mb-4">Found a deviation? Report it immediately.</p>
            <button 
              onClick={() => navigate('/supplier-hub/ncr')}
              className="px-6 py-2 bg-slate-800 hover:bg-amber-900/20 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-900 transition-all rounded-lg font-bold"
            >
              Open NCR Form
            </button>
          </div>
        </div>
      </div>
    </SupplierHubLayout>
  );
};

export default JobDetailsPage;