import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, CheckCircle, Upload, ArrowLeft, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function QCPage() {
  const { rz_job_id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    qc_date: '',
    units_tested: '',
    units_passed: '',
    units_failed: '',
    pass_percentage: '',
    defects_found: '',
    corrective_actions: '',
    certifications: 'yes',
    notes: ''
  });

  useEffect(() => {
    fetchJob();
  }, [rz_job_id]);

  const handleUnitsPassed = (e) => {
    const tested = parseInt(formData.units_tested) || 0;
    const passed = parseInt(e.target.value) || 0;
    const failed = tested - passed;
    const percentage = tested > 0 ? ((passed / tested) * 100).toFixed(2) : '0';
    
    setFormData({
      ...formData,
      units_passed: e.target.value,
      units_failed: failed.toString(),
      pass_percentage: percentage
    });
  };

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('rz_job_id', rz_job_id)
        .single();

      if (error) throw error;
      setJob(data);
      setFormData(prev => ({ ...prev, qc_date: new Date().toISOString().split('T')[0] }));
    } catch (err) {
      console.error(err);
      setError('Job not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('job_updates')
        .insert([{
          rz_job_id,
          supplier_id: currentUser.id,
          stage: 'QC',
          update_type: 'qc_inspected',
          data: formData,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'QC report submitted successfully'
      });

      setFormData({
        qc_date: new Date().toISOString().split('T')[0],
        units_tested: '',
        units_passed: '',
        units_failed: '',
        pass_percentage: '',
        defects_found: '',
        corrective_actions: '',
        certifications: 'yes',
        notes: ''
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <SupplierHubLayout>
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-cyan-500 w-10 h-10" />
      </div>
    </SupplierHubLayout>
  );

  if (error || !job) return (
    <SupplierHubLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-6 flex gap-4">
          <AlertCircle className="text-red-500 flex-shrink-0 w-6 h-6 mt-1" />
          <div>
            <h3 className="font-bold text-red-400">Error</h3>
            <p className="text-red-400/80">{error}</p>
          </div>
        </div>
      </div>
    </SupplierHubLayout>
  );

  return (
    <SupplierHubLayout>
      <Helmet>
        <title>{`Quality Control - ${job.part_name || 'Job'}`}</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost"
          onClick={() => navigate(`/supplier-hub/job-tracking/${rz_job_id}`)}
          className="text-slate-400 hover:text-white mb-6 pl-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Job Details
        </Button>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-3">
                <Shield className="text-emerald-500" size={32} />
                Quality Control & Inspection
              </h1>
              <p className="text-slate-400">
                RZ Job ID: <span className="font-mono text-cyan-400">{job.rz_job_id}</span>
              </p>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg px-4 py-2">
              <p className="text-sm text-emerald-400 font-medium">QC</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-slate-500 text-sm mb-1">Part Name</p>
              <p className="text-slate-100 font-semibold">{job.part_name}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-slate-500 text-sm mb-1">Total Quantity</p>
              <p className="text-slate-100 font-semibold">{job.quantity || 'N/A'} units</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">QC Date</label>
                <Input
                  type="date"
                  value={formData.qc_date}
                  onChange={(e) => setFormData({ ...formData, qc_date: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Units Tested</label>
                <Input
                  type="number"
                  value={formData.units_tested}
                  onChange={(e) => setFormData({ ...formData, units_tested: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Units Passed</label>
                <Input
                  type="number"
                  value={formData.units_passed}
                  onChange={handleUnitsPassed}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-4">
              <div>
                <p className="text-slate-500 text-sm mb-1">Units Failed</p>
                <p className="text-slate-100 font-semibold text-lg">{formData.units_failed || 0}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm mb-1">Pass Percentage</p>
                <p className="text-emerald-400 font-semibold text-lg">{formData.pass_percentage}%</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm mb-1">Status</p>
                <p className={`font-semibold text-lg ${formData.pass_percentage >= 95 ? 'text-emerald-400' : formData.pass_percentage >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {formData.pass_percentage >= 95 ? 'PASSED ✓' : formData.pass_percentage >= 80 ? 'MARGINAL' : 'FAILED ✗'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Defects Found</label>
              <textarea
                placeholder="List all defects detected during inspection (e.g., dimensional inaccuracies, surface defects, material issues)..."
                value={formData.defects_found}
                onChange={(e) => setFormData({ ...formData, defects_found: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Corrective Actions Taken</label>
              <textarea
                placeholder="Actions taken to address defects or improve quality..."
                value={formData.corrective_actions}
                onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none h-20"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                id="certifications"
                checked={formData.certifications === 'yes'}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.checked ? 'yes' : 'no' })}
                className="w-4 h-4 accent-emerald-500"
              />
              <label htmlFor="certifications" className="text-slate-300 cursor-pointer">All required certifications & test reports included</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Additional QC Notes</label>
              <textarea
                placeholder="Any additional information about quality control procedures, test methods, or recommendations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none h-20"
              />
            </div>

            <Button
              type="submit"
              disabled={updating}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit QC Report
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </SupplierHubLayout>
  );
}
