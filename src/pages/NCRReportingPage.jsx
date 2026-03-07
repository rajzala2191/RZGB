import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { logNCRReport } from '@/lib/auditLogger';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, Send } from 'lucide-react';

const NCRReportingPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rz_job_id: '',
    issue_type: 'Material Deviation',
    severity: 'Low',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('rz_job_id', formData.rz_job_id)
        .single();

      if (orderError || !order) throw new Error("Invalid Job ID");

      const { error: ncrError } = await supabase.from('ncr_reports').insert({
        order_id: order.id,
        supplier_id: currentUser.id,
        issue_type: formData.issue_type,
        severity: formData.severity,
        description: formData.description,
        status: 'reported'
      });

      if (ncrError) throw ncrError;

      await logNCRReport(currentUser.id, order.id, formData.issue_type);

      toast({
        title: "NCR Submitted",
        description: "Admin team has been notified.",
        className: "bg-emerald-600 border-emerald-700 text-white"
      });
      
      setFormData({ rz_job_id: '', issue_type: 'Material Deviation', severity: 'Low', description: '' });

    } catch (error) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SupplierHubLayout>
      <Helmet><title>Report NCR - Supplier Hub</title></Helmet>
      
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-900/50">
            <AlertTriangle className="text-amber-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Non-Conformance Report</h1>
          <p className="text-slate-400 mt-2">Report deviations or quality issues immediately.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0f172a] border border-slate-800 rounded-xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">RZ Job ID</label>
            <input 
              required
              type="text"
              placeholder="e.g. RZ-JOB-1234"
              value={formData.rz_job_id}
              onChange={(e) => setFormData({...formData, rz_job_id: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Issue Type</label>
              <select 
                value={formData.issue_type}
                onChange={(e) => setFormData({...formData, issue_type: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
              >
                <option>Material Deviation</option>
                <option>Manufacturing Error</option>
                <option>Quality Issue</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Severity</label>
              <select 
                value={formData.severity}
                onChange={(e) => setFormData({...formData, severity: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-slate-400 mb-2">Detailed Description</label>
             <textarea 
               required
               rows={5}
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
               className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
               placeholder="Describe the issue, potential cause, and impact..."
             />
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            Submit Report
          </button>
        </form>
      </div>
    </SupplierHubLayout>
  );
};

export default NCRReportingPage;