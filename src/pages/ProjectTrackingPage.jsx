
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  CheckCircle, 
  Clock, 
  Circle, 
  FileText, 
  Download, 
  AlertCircle, 
  Loader2, 
  Activity,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STAGES = [
  { id: 'intake', label: 'Project Intake', status: 'PENDING_ADMIN_SCRUB' },
  { id: 'scrubbing', label: 'Document Scrubbing', status: 'PENDING_ADMIN_SCRUB' },
  { id: 'sanitisation', label: 'Sanitisation', status: 'SANITIZED' },
  { id: 'release', label: 'Release to Supplier', status: 'SANITIZED' },
  { id: 'bidding', label: 'Supplier Bidding', status: 'OPEN_FOR_BIDDING' },
  { id: 'award', label: 'Bid Review & Award', status: 'AWARDED' },
  { id: 'material', label: 'Material Update', status: 'MATERIAL_UPDATE' },
  { id: 'casting', label: 'Casting', status: 'CASTING' },
  { id: 'machining', label: 'Machining', status: 'MACHINING' },
  { id: 'qc', label: 'QC', status: 'QC' },
  { id: 'dispatch', label: 'Dispatch', status: 'DISPATCH' },
  { id: 'delivery', label: 'Delivery & Completion', status: 'COMPLETED' }
];

export default function ProjectTrackingPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('order_id', projectId);
        
      if (docsData) setDocuments(docsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center p-24 h-full">
          <Loader2 className="animate-spin text-cyan-500 w-10 h-10 mb-4" />
          <p className="text-slate-400 font-medium">Loading project tracking data...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!order) {
    return (
      <ClientDashboardLayout>
        <div className="p-16 flex flex-col items-center text-red-400 gap-4">
          <AlertCircle size={32} />
          <p>Project not found.</p>
          <Button onClick={() => navigate('/client-dashboard/projects')} variant="outline">Back to Projects</Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  // Determine current stage index based on order status
  const currentStatus = order.order_status || order.status || 'PENDING_ADMIN_SCRUB';
  let currentStageIndex = STAGES.findIndex(s => s.status === currentStatus);
  if (currentStageIndex === -1) currentStageIndex = 0; // fallback

  return (
    <ClientDashboardLayout>
      <Helmet><title>Project Tracking - {order.part_name || 'Project'}</title></Helmet>
      
      <div className="max-w-6xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/client-dashboard/orders/${order.id}`)}
          className="text-slate-400 hover:text-white mb-2 pl-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Order Details
        </Button>

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">{order.part_name || 'Unnamed Project'}</h1>
            <p className="text-slate-400 mt-1">ID: {order.id.slice(0, 8)} | Status: <span className="text-cyan-400 font-mono">{currentStatus.replace(/_/g, ' ')}</span></p>
          </div>
          <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">
            <Download className="w-4 h-4 mr-2" /> Download All Documents
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline View */}
          <div className="lg:col-span-2 bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Activity className="text-cyan-500" /> Complete Workflow Timeline
            </h2>
            
            <div className="relative">
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-800"></div>
              <div className="space-y-6 relative z-10">
                {STAGES.map((stage, index) => {
                  const isCompleted = index < currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  
                  return (
                    <div key={stage.id} className={`flex items-start gap-4 ${isCompleted ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 bg-[#0f172a] transition-colors ${isCompleted ? 'border-emerald-500 text-emerald-500' : isCurrent ? 'border-cyan-500 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'border-slate-700 text-slate-600'}`}>
                        {isCompleted ? <CheckCircle size={20} /> : isCurrent ? <Clock size={20} className="animate-pulse" /> : <Circle size={20} />}
                      </div>
                      <div className="flex-1 pt-2">
                        <h3 className={`text-lg font-bold ${isCompleted ? 'text-slate-200' : isCurrent ? 'text-cyan-400' : 'text-slate-500'}`}>
                          {stage.label}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {isCompleted ? 'Completed successfully.' : isCurrent ? 'Currently in progress. Awaiting updates.' : 'Pending future action.'}
                        </p>
                        
                        {isCurrent && (
                          <div className="mt-3 bg-[#1e293b] p-3 rounded-lg border border-slate-700">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Stage Progress</span>
                              <span>45%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                              <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <h3 className="font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">Stage Documents</h3>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-slate-700">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="text-cyan-500 shrink-0" size={16} />
                        <span className="text-sm text-slate-300 truncate">{doc.file_name}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Download size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">No documents uploaded for this stage yet.</p>
              )}
            </div>

            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <h3 className="font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">Activity Feed</h3>
              <div className="space-y-4">
                <div className="border-l-2 border-slate-700 pl-4 py-1 relative">
                  <div className="absolute w-2 h-2 rounded-full bg-cyan-500 -left-[5px] top-2"></div>
                  <p className="text-sm text-slate-300">Status updated to {currentStatus}</p>
                  <span className="text-xs text-slate-500">{new Date(order.updated_at).toLocaleString()}</span>
                </div>
                <div className="border-l-2 border-slate-700 pl-4 py-1 relative">
                  <div className="absolute w-2 h-2 rounded-full bg-slate-600 -left-[5px] top-2"></div>
                  <p className="text-sm text-slate-300">Project Order Created</p>
                  <span className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
}
