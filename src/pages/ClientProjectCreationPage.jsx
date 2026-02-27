import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { logInfo, logError } from '@/lib/logger';

const ClientProjectCreationPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
     name: '',
     code: '',
     description: '',
     site_address: '',
     expected_completion: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const workflow = 'ClientProjectCreation';
    logInfo(workflow, 'Starting project creation', formData);

    try {
      const projectCode = formData.code || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const payload = {
         client_id: currentUser.id,
         project_name: formData.name, 
         project_code: projectCode,
         description: formData.description,
         project_site_address: formData.site_address,
         expected_completion_date: formData.expected_completion || null,
         status: 'active',
         created_at: new Date().toISOString()
      };

      logInfo(workflow, 'Submitting payload to Supabase', payload);

      const { data, error } = await supabase.from('projects').insert(payload).select('id, client_id, project_name, project_code, description, project_site_address, expected_completion_date, status, created_at').single();

      if (error) throw error;
      
      logInfo(workflow, 'Project created successfully', data);
      toast({ title: "Project Created", description: `Project ${projectCode} initialized successfully.` });
      
      await supabase.from('audit_logs').insert({
          admin_id: currentUser.id,
          action: 'PROJECT_CREATED',
          details: `Created project: ${formData.name}`,
          status: 'success'
      });

      navigate('/client-dashboard/projects');
    } catch (err) {
      logError(workflow, 'Project creation failed', err);
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ClientDashboardLayout>
       <Helmet><title>New Project - Client Portal</title></Helmet>
       <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back
       </button>
       <div className="max-w-3xl mx-auto">
          <div className="mb-8">
             <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                <Briefcase className="text-cyan-500" size={32} /> Initialize New Project
             </h1>
          </div>
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8 shadow-xl">
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Project Name *</label>
                      <input 
                         required
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                         className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:border-cyan-500 focus:outline-none"
                         placeholder="e.g. Alpha Protocol Prototype"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Project Code (Optional)</label>
                      <input 
                         value={formData.code}
                         onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                         className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
                         placeholder="Auto-generated if empty"
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                   <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:border-cyan-500 focus:outline-none min-h-[100px]"
                   />
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Site / Delivery Address *</label>
                   <input 
                      required
                      value={formData.site_address}
                      onChange={e => setFormData({...formData, site_address: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:border-cyan-500 focus:outline-none"
                   />
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Expected Completion</label>
                   <input 
                      type="date"
                      value={formData.expected_completion}
                      onChange={e => setFormData({...formData, expected_completion: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:border-cyan-500 focus:outline-none"
                   />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                   <button 
                      type="submit" 
                      disabled={submitting}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-900/20 disabled:opacity-50"
                   >
                      {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                      Create Project
                   </button>
                </div>
             </form>
          </div>
       </div>
    </ClientDashboardLayout>
  );
};

export default ClientProjectCreationPage;