import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2, ArrowLeft, CheckCircle2, Clock, AlertCircle, Package,
  Truck, FileText, TrendingUp, Calendar, DollarSign, MapPin,
  FileCheck, Zap, BarChart3, Hourglass, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';

const LiveProjectTracking = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pipeline stages in order
  const STAGES = [
    { id: 'PENDING_ADMIN_SCRUB', label: 'Order Received', color: 'blue', icon: Package },
    { id: 'SANITIZED', label: 'Sanitizing', color: 'purple', icon: FileCheck },
    { id: 'OPEN_FOR_BIDDING', label: 'Ready for Bid', color: 'indigo', icon: Zap },
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

    // Set up realtime subscription for job_updates
    const channel = supabase
      .channel(`live-tracking-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_updates' },
        () => fetchProjectData()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${projectId}` },
        () => fetchProjectData()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
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

      // Fetch job updates
      const { data: updatesData, error: updatesError } = await supabase
        .from('job_updates')
        .select('*')
        .eq('rz_job_id', projectData.rz_job_id)
        .order('created_at', { ascending: true });

      if (updatesError) throw updatesError;
      setUpdates(updatesData || []);
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

  // Group updates by stage
  const updatesByStage = {};
  updates.forEach(update => {
    if (!updatesByStage[update.stage]) {
      updatesByStage[update.stage] = [];
    }
    updatesByStage[update.stage].push(update);
  });

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
                const hasUpdates = updatesByStage[stage.id];
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
                      {hasUpdates && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {hasUpdates.length} update{hasUpdates.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Real-time Updates Feed */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <FileText size={24} className="text-blue-400" />
            Live Updates & Reports
          </h2>

          {updates.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Waiting for first supplier update...</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {updates.map((update, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-white">{update.stage?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-400">{update.update_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <p className="text-xs text-slate-500">{format(new Date(update.created_at), 'MMM dd, HH:mm')}</p>
                  </div>
                  
                  {update.data && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {Object.entries(update.data).slice(0, 6).map(([key, value]) => (
                        <div key={key} className="bg-slate-800/50 p-2 rounded">
                          <p className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-slate-200 font-semibold truncate">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quality & Compliance Reports */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-emerald-400" />
                QC Status
              </h3>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              project.is_qc_approved 
                ? 'bg-emerald-950/50 border border-emerald-500/50' 
                : 'bg-amber-950/50 border border-amber-500/50'
            }`}>
              <p className={`text-2xl font-black ${
                project.is_qc_approved ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {project.is_qc_approved ? '✓ APPROVED' : '⟳ PENDING'}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-950/30 to-slate-900 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FileCheck size={20} className="text-blue-400" />
                Documentation
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={16} className="text-cyan-400" />
                Order Specifications
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={16} className="text-cyan-400" />
                Quality Reports
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={16} className="text-cyan-400" />
                Shipping Documents
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default LiveProjectTracking;
