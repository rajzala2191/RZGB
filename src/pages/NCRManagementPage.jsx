import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const NCRManagementPage = () => {
  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNcrs = async () => {
      const { data, error } = await supabase
        .from('ncr_reports')
        .select('*, order:order_id(rz_job_id), supplier:supplier_id(email)')
        .order('created_at', { ascending: false });
        
      if (!error) setNcrs(data);
      setLoading(false);
    };
    fetchNcrs();
  }, []);

  const handleDecision = async (id, decision, notifyClient) => {
    // Logic to update NCR status
    // For brevity, just UI update simulation
    setNcrs(prev => prev.map(n => n.id === id ? { ...n, status: 'resolved', admin_decision: decision, client_notified: notifyClient } : n));
  };

  return (
    <ControlCentreLayout>
      <Helmet><title>NCR Management - Admin</title></Helmet>
      
      <h1 className="text-3xl font-bold text-white mb-6">NCR Management</h1>

      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-sky-500" /></div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
              <tr>
                <th className="p-4">RZ Job ID</th>
                <th className="p-4">Issue</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {ncrs.map(ncr => (
                <tr key={ncr.id}>
                  <td className="p-4 font-mono">{ncr.order?.rz_job_id}</td>
                  <td className="p-4">{ncr.issue_type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ncr.severity === 'Critical' ? 'bg-red-900 text-red-400' : 'bg-slate-800'}`}>
                      {ncr.severity}
                    </span>
                  </td>
                  <td className="p-4 uppercase text-xs font-bold">{ncr.status}</td>
                  <td className="p-4 text-right">
                    {ncr.status === 'reported' && (
                      <div className="flex justify-end gap-2">
                         <button onClick={() => handleDecision(ncr.id, 'Approved - Minor', false)} className="p-2 hover:bg-emerald-900/30 text-emerald-400 rounded"><CheckCircle size={18} /></button>
                         <button onClick={() => handleDecision(ncr.id, 'Notify Client', true)} className="p-2 hover:bg-red-900/30 text-red-400 rounded"><AlertTriangle size={18} /></button>
                      </div>
                    )}
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

export default NCRManagementPage;