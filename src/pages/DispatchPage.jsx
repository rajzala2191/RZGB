import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Truck, Upload, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function DispatchPage() {
  const { rz_job_id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    units_dispatched: '',
    dispatch_date: '',
    courier: '',
    tracking_number: '',
    shipping_address: '',
    estimated_delivery: '',
    packaging_type: 'standard',
    special_handling: '',
    documents_included: 'yes',
    notes: ''
  });

  const PACKAGING_TYPES = [
    { value: 'standard', label: 'Standard Packaging' },
    { value: 'anti-static', label: 'Anti-Static Packaging' },
    { value: 'vacuum-sealed', label: 'Vacuum Sealed' },
    { value: 'climate-controlled', label: 'Climate Controlled' },
    { value: 'fragile', label: 'Fragile/Protective' },
    { value: 'custom', label: 'Custom Packaging' }
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
      setFormData(prev => ({ ...prev, dispatch_date: new Date().toISOString().split('T')[0] }));
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
          stage: 'DISPATCH',
          update_type: 'dispatched',
          data: formData,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Update order status
      await supabase
        .from('orders')
        .update({ order_status: 'DISPATCHED' })
        .eq('rz_job_id', rz_job_id);

      toast({
        title: 'Success',
        description: 'Dispatch information submitted successfully'
      });

      setFormData({
        units_dispatched: '',
        dispatch_date: new Date().toISOString().split('T')[0],
        courier: '',
        tracking_number: '',
        shipping_address: '',
        estimated_delivery: '',
        packaging_type: 'standard',
        special_handling: '',
        documents_included: 'yes',
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
        <title>{`Dispatch - ${job.part_name || 'Job'}`}</title>
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
                <Truck className="text-blue-500" size={32} />
                Shipment & Dispatch
              </h1>
              <p className="text-slate-400">
                RZ Job ID: <span className="font-mono text-cyan-400">{job.rz_job_id}</span>
              </p>
            </div>
            <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-400 font-medium">DISPATCH</p>
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Units Being Dispatched</label>
                <Input
                  type="number"
                  value={formData.units_dispatched}
                  onChange={(e) => setFormData({ ...formData, units_dispatched: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Dispatch Date</label>
                <Input
                  type="date"
                  value={formData.dispatch_date}
                  onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Courier/Logistics Company</label>
                <Input
                  type="text"
                  placeholder="e.g., DPD, FedEx, UPS, DHL"
                  value={formData.courier}
                  onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tracking Number</label>
                <Input
                  type="text"
                  placeholder="Courier tracking number"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Address</label>
                <textarea
                  placeholder="Full shipping address for the consignment"
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Delivery Date</label>
                <Input
                  type="date"
                  value={formData.estimated_delivery}
                  onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Packaging Type</label>
                <select
                  value={formData.packaging_type}
                  onChange={(e) => setFormData({ ...formData, packaging_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {PACKAGING_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Special Handling Requirements</label>
              <textarea
                placeholder="Any special handling, storage, or shipping instructions (e.g., 'Keep Dry', 'Handle with Care', specific temperature requirements)..."
                value={formData.special_handling}
                onChange={(e) => setFormData({ ...formData, special_handling: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none h-20"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                id="documents"
                checked={formData.documents_included === 'yes'}
                onChange={(e) => setFormData({ ...formData, documents_included: e.target.checked ? 'yes' : 'no' })}
                className="w-4 h-4 accent-blue-500"
              />
              <label htmlFor="documents" className="text-slate-300 cursor-pointer">All required documents (certificates, test reports, COA) included in shipment</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Dispatch Notes</label>
              <textarea
                placeholder="Any additional information about the shipment, insurance, or special instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none h-20"
              />
            </div>

            <Button
              type="submit"
              disabled={updating}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  Submit Dispatch Information
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </SupplierHubLayout>
  );
}
