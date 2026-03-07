import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileDown, Rocket, AlertCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { createAuditLog } from '@/lib/auditLogger';
import { useAuth } from '@/contexts/AuthContext';
import { logInfo, logError } from '@/lib/logger';

const IntakeGatePage = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const fetchPendingRfqs = async () => {
    logInfo('IntakeGate', 'Fetching pending RFQs');
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`*, profile:uploaded_by(company_name, email)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      logInfo('IntakeGate', 'Fetched RFQs successfully', { count: data?.length });
      setRfqs(data || []);
    } catch (err) {
      logError('IntakeGate', 'Error fetching RFQs', err);
      setError(err.message);
      toast({ title: "RZ Global Solutions Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRfqs();
    
    logInfo('IntakeGate', 'Subscribing to realtime updates on documents');
    const channel = supabase.channel('intake-gate-rfqs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'documents', filter: 'status=eq.pending' }, (payload) => {
        logInfo('IntakeGate', 'Realtime update received', payload);
        toast({ title: "New RFQ received!", description: "An RFQ has entered the intake gate." });
        fetchPendingRfqs();
      })
      .subscribe();

    return () => {
      logInfo('IntakeGate', 'Unsubscribing from realtime updates');
      supabase.removeChannel(channel);
    };
  }, []);

  const handleProcess = async (rfqId, rfq) => {
    logInfo('IntakeGate', `Processing RFQ ${rfqId}`, rfq);
    try {
      const year = new Date().getFullYear();
      const rzJobId = `RZ-${year}-${Math.floor(100 + Math.random() * 900)}`;

      logInfo('IntakeGate', 'Updating document status to processing');
      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'processing', redaction_notes: `Assigned Job ID: ${rzJobId}` })
        .eq('id', rfqId);

      if (updateError) throw updateError;

      await createAuditLog({
        userId: currentUser?.id,
        action: 'PROCESS_RFQ',
        details: `Started processing RFQ. Assigned ID: ${rzJobId}`,
        status: 'success'
      });

      toast({ title: "Processing Started", description: `RFQ assigned ID: ${rzJobId}` });
      fetchPendingRfqs();
      
    } catch (err) {
      logError('IntakeGate', 'Processing Failed', err);
      toast({ title: "Processing Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <ControlCentreLayout>
      <Helmet><title>RFQ Intake Gate - RZ Global Solutions</title></Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">RFQ Intake Gate</h1>
        <p className="text-slate-400">Review and process new incoming Requests for Quotation.</p>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 mb-4 animate-pulse" />
            <Loader2 className="animate-spin text-sky-500 w-8 h-8 mb-2" />
            <p className="text-slate-400 font-medium">RZ Global Solutions is loading RFQs...</p>
          </div>
        ) : error ? (
          <div className="p-16 flex flex-col items-center text-red-400 gap-4">
            <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 opacity-50 grayscale" />
            <div className="flex items-center gap-2 text-lg font-bold">
              <AlertCircle size={24} /> RZ Global Solutions Error
            </div>
            <p>{error}</p>
          </div>
        ) : rfqs.length === 0 ? (
          <div className="p-16 text-center text-slate-500">The intake gate is clear. No pending RFQs.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[400px]">
              <thead className="bg-slate-950/30 text-xs text-slate-500 uppercase tracking-wider">
                <tr><th className="p-4">Client</th><th className="p-4">File Name</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rfqs.map(rfq => (
                  <tr key={rfq.id} className="hover:bg-slate-900/50">
                    <td className="p-4">
                      <div className="font-medium text-slate-200">{rfq.profile?.company_name || 'Unknown Client'}</div>
                    </td>
                    <td className="p-4 text-slate-300">{rfq.file_name}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleProcess(rfq.id, rfq)} className="p-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white">
                        <Rocket size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
};

export default IntakeGatePage;