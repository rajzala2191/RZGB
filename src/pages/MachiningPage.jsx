import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Cog, Upload, ArrowLeft, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function MachiningPage() {
  const { rz_job_id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    machine_type: 'cnc',
    machining_started: '',
    machining_completed: '',
    units_machined: '',
    surface_finish: '',
    tolerance_achieved: '',
    notes: '',
    rework_required: false
  });

  const MACHINE_TYPES = [
    { value: 'cnc', label: 'CNC Machine' },
    { value: 'lathe', label: 'Lathe' },
    { value: 'milling', label: 'Milling Machine' },
    { value: 'grinding', label: 'Grinding' },
    { value: 'drilling', label: 'Drilling' },
    { value: 'multi-axis', label: 'Multi-Axis CNC' },
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
          stage: 'MACHINING',
          update_type: 'machining_completed',
          data: formData,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Machining update submitted successfully'
      });

      setFormData({
        machine_type: 'cnc',
        machining_started: '',
        machining_completed: '',
        units_machined: '',
        surface_finish: '',
        tolerance_achieved: '',
        notes: '',
        rework_required: false
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
        <title>{`Machining - ${job.part_name || 'Job'}`}</title>
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
                <Cog className="text-purple-500" size={32} />
                CNC Machining & Precision Operations
              </h1>
              <p className="text-slate-400">
                RZ Job ID: <span className="font-mono text-cyan-400">{job.rz_job_id}</span>
              </p>
            </div>
            <div className="bg-purple-950/30 border border-purple-500/30 rounded-lg px-4 py-2">
              <p className="text-sm text-purple-400 font-medium">MACHINING</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-slate-500 text-sm mb-1">Part Name</p>
              <p className="text-slate-100 font-semibold">{job.part_name}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-slate-500 text-sm mb-1">Tolerance Required</p>
              <p className="text-slate-100 font-semibold">{job.tolerance || 'Not specified'}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-slate-500 text-sm mb-1">Surface Finish Required</p>
              <p className="text-slate-100 font-semibold">{job.surface_finish || 'Not specified'}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-slate-500 text-sm mb-1">Total Quantity</p>
              <p className="text-slate-100 font-semibold">{job.quantity || 'N/A'} units</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Primary Machine Used</label>
                <select
                  value={formData.machine_type}
                  onChange={(e) => setFormData({ ...formData, machine_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {MACHINE_TYPES.map(machine => (
                    <option key={machine.value} value={machine.value}>{machine.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Units Machined</label>
                <Input
                  type="number"
                  value={formData.units_machined}
                  onChange={(e) => setFormData({ ...formData, units_machined: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Machining Started</label>
                <Input
                  type="datetime-local"
                  value={formData.machining_started}
                  onChange={(e) => setFormData({ ...formData, machining_started: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Machining Completed</label>
                <Input
                  type="datetime-local"
                  value={formData.machining_completed}
                  onChange={(e) => setFormData({ ...formData, machining_completed: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Surface Finish Achieved (Ra µm)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 0.8, 1.6, 3.2"
                  value={formData.surface_finish}
                  onChange={(e) => setFormData({ ...formData, surface_finish: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tolerance Achieved (µm)</label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="e.g., ±0.05, ±0.1"
                  value={formData.tolerance_achieved}
                  onChange={(e) => setFormData({ ...formData, tolerance_achieved: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                id="rework"
                checked={formData.rework_required}
                onChange={(e) => setFormData({ ...formData, rework_required: e.target.checked })}
                className="w-4 h-4 accent-purple-500"
              />
              <label htmlFor="rework" className="text-slate-300 cursor-pointer">Rework Required</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Machining Notes</label>
              <textarea
                placeholder="Details about machining operations, tools used, any challenges or adjustments made, etc..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none h-24"
              />
            </div>

            <Button
              type="submit"
              disabled={updating}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Machining Update
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </SupplierHubLayout>
  );
}
