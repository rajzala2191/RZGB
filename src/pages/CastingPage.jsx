import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Hammer, Upload, ArrowLeft, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function CastingPage() {
  const { rz_job_id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    cast_method: 'sand',
    cast_started: '',
    cast_completed: '',
    units_cast: '',
    yield_percentage: '',
    notes: '',
    defects: ''
  });

  const CASTING_METHODS = [
    { value: 'sand', label: 'Sand Casting' },
    { value: 'investment', label: 'Investment Casting' },
    { value: 'die', label: 'Die Casting' },
    { value: 'continuous', label: 'Continuous Casting' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchJob();
  }, [rz_job_id]);

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
          stage: 'CASTING',
          update_type: 'casting_completed',
          data: formData,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Casting update submitted successfully'
      });

      setFormData({
        cast_method: 'sand',
        cast_started: '',
        cast_completed: '',
        units_cast: '',
        yield_percentage: '',
        notes: '',
        defects: ''
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
        <title>{`Casting - ${job.part_name || 'Job'}`}</title>
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
                <Hammer className="text-amber-500" size={32} />
                Casting Operations
              </h1>
              <p className="text-slate-400">
                RZ Job ID: <span className="font-mono text-cyan-400">{job.rz_job_id}</span>
              </p>
            </div>
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg px-4 py-2">
              <p className="text-sm text-amber-400 font-medium">CASTING</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Casting Method</label>
                <select
                  value={formData.cast_method}
                  onChange={(e) => setFormData({ ...formData, cast_method: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {CASTING_METHODS.map(method => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Units Cast</label>
                <Input
                  type="number"
                  value={formData.units_cast}
                  onChange={(e) => setFormData({ ...formData, units_cast: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Casting Started</label>
                <Input
                  type="datetime-local"
                  value={formData.cast_started}
                  onChange={(e) => setFormData({ ...formData, cast_started: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Casting Completed</label>
                <Input
                  type="datetime-local"
                  value={formData.cast_completed}
                  onChange={(e) => setFormData({ ...formData, cast_completed: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Yield Percentage (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="85.5"
                  value={formData.yield_percentage}
                  onChange={(e) => setFormData({ ...formData, yield_percentage: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Defects Identified</label>
              <textarea
                placeholder="List any defects found during casting inspection (e.g., blowholes, shrinkage cavities, cold shuts)..."
                value={formData.defects}
                onChange={(e) => setFormData({ ...formData, defects: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes</label>
              <textarea
                placeholder="Any additional information about the casting process, challenges faced, or next steps..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none h-24"
              />
            </div>

            <Button
              type="submit"
              disabled={updating}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Casting Update
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </SupplierHubLayout>
  );
}
