import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import AssetViewer from '@/components/AssetViewer';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2, ArrowLeft, CheckCircle2, AlertCircle, Package,
  Truck, TrendingUp, Calendar, DollarSign, MapPin,
  FileCheck, Zap, Hourglass, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';

const LiveProjectTracking = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pipeline stages in order
  const STAGES = [
    { id: 'INTAKE', label: 'Order Received', color: 'blue', icon: Package },
    { id: 'SCRUBBING', label: 'Sanitizing', color: 'purple', icon: FileCheck },
    { id: 'SANITISED', label: 'Ready for Bid', color: 'indigo', icon: Zap },
    { id: 'BIDDING', label: 'Supplier Bidding', color: 'cyan', icon: TrendingUp },
    { id: 'AWARDED', label: 'Order Awarded', color: 'amber', icon: CheckCircle2 },
    { id: 'MATERIAL', label: 'Material Sourcing', color: 'sky', icon: Package },
    { id: 'CASTING', label: 'Casting', color: 'orange', icon: Zap },
    { id: 'MACHINING', label: 'Machining', color: 'violet', icon: Hourglass },
    { id: 'QC', label: 'Quality Control', color: 'emerald', icon: ShieldCheck },
    { id: 'DISPATCH', label: 'Dispatch', color: 'blue', icon: Truck },
    { id: 'DELIVERED', label: 'Delivered', color: 'green', icon: CheckCircle2 },
  ];

  useEffect(() => {
    fetchProjectData();
    const interval = setInterval(fetchProjectData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch uploaded drawings/documents for this order
      const { data: docsData } = await supabase
        .from('documents')
        .select('id, file_name, file_url, file_path')
        .eq('order_id', projectData.id)
        .order('created_at', { ascending: false });

      const mapped = (docsData || []).map(doc => ({
        id: doc.id,
        asset_name: doc.file_name,
        asset_type: doc.file_name?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
        file_size: null,
        download_enabled: false,
        file_url: doc.file_url,
      }));
      setDrawings(mapped);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load project data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <ClientDashboardLayout>
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-cyan-500 w-12 h-12" />
      </div>
    </ClientDashboardLayout>
  );

  if (error || !project) return (
    <ClientDashboardLayout>
      <div className="bg-red-950/30 border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-300 font-semibold">{error}</p>
      </div>
    </ClientDashboardLayout>
  );

  // Calculate current stage index
  const currentStageIndex = STAGES.findIndex(s => s.id === project.order_status);

  // Calculate days remaining
  const daysRequested = project.delivery_days || 60;
  const orderDate = new Date(project.created_at);
  const dueDate = new Date(orderDate.getTime() + daysRequested * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
  const isOnTrack = daysRemaining > 0;

  return (
    <ClientDashboardLayout>
      <Helmet><title>{project.ghost_public_name} - Project Tracking</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 text-sm font-bold">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-white font-mono tracking-tight mb-2">{project.ghost_public_name}</h1>
              <p className="text-slate-400 text-sm">RZ Job ID: <span className="text-cyan-400 font-mono">{project.rz_job_id}</span></p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-sm border ${
              isOnTrack 
                ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400' 
                : 'bg-red-950/50 border-red-500 text-red-400'
            }`}>
              {isOnTrack ? '✓ On Track' : '⚠ At Risk'} • {Math.abs(daysRemaining)} days {isOnTrack ? 'remaining' : 'overdue'}
            </div>
          </div>
        </div>

        {/* Order Details Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quantity */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Quantity</p>
              <Package className="text-blue-400" size={18} />
            </div>
            <p className="text-2xl font-black text-slate-100">{project.quantity.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-2">{project.material}</p>
          </div>

          {/* Unit Price */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Unit Price</p>
              <DollarSign className="text-emerald-400" size={18} />
            </div>
            <p className="text-2xl font-black text-slate-100">£{project.unit_price}</p>
            <p className="text-xs text-slate-400 mt-2">Total: £{(project.quantity * project.unit_price).toLocaleString()}</p>
          </div>

          {/* Delivery */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Delivery</p>
              <Calendar className="text-amber-400" size={18} />
            </div>
            <p className="text-2xl font-black text-slate-100">{daysRequested} days</p>
            <p className="text-xs text-slate-400 mt-2">{format(dueDate, 'MMM dd, yyyy')}</p>
          </div>

          {/* Delivery Location */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Location</p>
              <MapPin className="text-cyan-400" size={18} />
            </div>
            <p className="text-lg font-black text-slate-100">{project.delivery_to || 'To your door'}</p>
            <p className="text-xs text-slate-400 mt-2">Delivery method</p>
          </div>
        </div>

        {/* Pipeline Visualization */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <Zap size={24} className="text-cyan-400" />
            Manufacturing Pipeline
          </h2>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute top-6 left-0 w-full h-1 bg-slate-800 -z-10" />
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx <= currentStageIndex && project.order_status !== 'CANCELLED';
                const isCurrent = idx === currentStageIndex;
                const StageIcon = stage.icon;

                return (
                  <div key={stage.id} className="relative">
                    <div className={`
                      w-full p-4 rounded-lg border-2 transition-all duration-300 text-center
                      ${isCurrent 
                        ? `bg-${stage.color}-950/50 border-${stage.color}-500 shadow-lg shadow-${stage.color}-900/30`
                        : isCompleted
                        ? `bg-emerald-950/30 border-emerald-500/50 text-emerald-400`
                        : `bg-slate-900 border-slate-700`
                      }
                    `}>
                      <StageIcon className={`w-6 h-6 mx-auto mb-2 ${
                        isCurrent ? `text-${stage.color}-400` :
                        isCompleted ? 'text-emerald-400' :
                        'text-slate-500'
                      }`} />
                      <p className={`text-xs font-bold uppercase tracking-wider ${
                        isCurrent ? `text-${stage.color}-400` :
                        isCompleted ? 'text-emerald-300' :
                        'text-slate-500'
                      }`}>
                        {stage.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawings Viewer */}
        <AssetViewer orderId={project.id} assets={drawings} />
      </div>
    </ClientDashboardLayout>
  );
};

export default LiveProjectTracking;
