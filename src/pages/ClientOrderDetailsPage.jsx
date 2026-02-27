
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { FileText, Download, ArrowRight, Loader2, ListTree } from 'lucide-react';

export default function ClientOrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (error) throw error;
      setOrder(data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load project details.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ClientDashboardLayout><div className="flex justify-center p-24"><Loader2 className="animate-spin text-cyan-500 w-10 h-10" /></div></ClientDashboardLayout>;
  if (!order) return <ClientDashboardLayout><div className="p-8 text-slate-400">Project not found.</div></ClientDashboardLayout>;

  const currentStatus = order.order_status || order.status || 'PENDING_ADMIN_SCRUB';

  return (
    <ClientDashboardLayout>
      <div className="max-w-6xl mx-auto py-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl">
          <div>
            <h1 className="text-3xl font-black text-slate-100">{order.part_name || 'Unnamed Project'}</h1>
            <p className="text-slate-400 mt-1 font-mono">Project ID: {order.id.slice(0, 8)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-4 py-2 bg-cyan-950/50 border border-cyan-800 text-cyan-400 rounded-lg font-bold text-sm uppercase tracking-wider">
              {currentStatus.replace(/_/g, ' ')}
            </span>
            <Button onClick={() => navigate(`/client-dashboard/projects/${order.id}/tracking`)} className="bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold border border-slate-700">
               <ListTree className="w-4 h-4 mr-2" /> View Workflow Tracking
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#0f172a] p-6 rounded-xl shadow-xl border border-slate-800">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3 mb-6 text-slate-100">Project Specifications</h2>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Material</p>
                  <p className="text-slate-200 font-medium">{order.material || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Quantity</p>
                  <p className="text-slate-200 font-medium">{order.quantity || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Tolerance</p>
                  <p className="text-slate-200 font-medium">{order.tolerance || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Surface Finish</p>
                  <p className="text-slate-200 font-medium">{order.surface_finish || 'As Machined'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Description</p>
                  <p className="text-slate-300 bg-[#1e293b] p-3 rounded-lg border border-slate-700 mt-1 min-h-[60px]">{order.description || 'No description provided.'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Special Requirements</p>
                  <p className="text-slate-300 bg-[#1e293b] p-3 rounded-lg border border-slate-700 mt-1 min-h-[60px]">{order.special_requirements || 'None specified.'}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl shadow-xl border border-slate-800">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3 mb-6 text-slate-100">Documents & Files</h2>
              <div className="space-y-3">
                 {/* Placeholder for actual files fetch. In real app, query documents table */}
                 <div className="flex items-center justify-between p-4 border border-slate-700 bg-[#1e293b] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-cyan-500" />
                      <div>
                        <p className="text-slate-200 font-medium">Initial_Design_Specs.pdf</p>
                        <p className="text-xs text-slate-500">Uploaded {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800"><Download className="w-5 h-5" /></Button>
                 </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions / Progress */}
          <div className="space-y-8">
            <div className="bg-[#0f172a] p-6 rounded-xl shadow-xl border border-slate-800">
              <h2 className="text-lg font-bold border-b border-slate-800 pb-3 mb-6 text-slate-100">Action Required</h2>
              {currentStatus === 'DRAFT' ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">Your project is in draft state. Submit it for engineering review when ready.</p>
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold">Submit for Review</Button>
                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <Loader2 className="w-12 h-12 text-cyan-500 mx-auto animate-spin mb-4" />
                  <p className="text-sm text-slate-300 font-medium">Project is currently locked for processing.</p>
                  <p className="text-xs text-slate-500">Awaiting status change from our engineering team.</p>
                </div>
              )}
            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl shadow-xl border border-slate-800">
               <h2 className="text-lg font-bold border-b border-slate-800 pb-3 mb-6 text-slate-100">Timeline Highlights</h2>
               <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:h-full before:w-0.5 before:bg-slate-700">
                 <div className="relative pl-6">
                   <div className="absolute w-2 h-2 rounded-full bg-cyan-500 left-[5px] top-1.5"></div>
                   <p className="text-sm font-bold text-slate-200">Current Status: {currentStatus}</p>
                   <p className="text-xs text-slate-500">{new Date(order.updated_at).toLocaleString()}</p>
                 </div>
                 <div className="relative pl-6">
                   <div className="absolute w-2 h-2 rounded-full bg-slate-600 left-[5px] top-1.5"></div>
                   <p className="text-sm font-medium text-slate-400">Project Created</p>
                   <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </ClientDashboardLayout>
  );
}
