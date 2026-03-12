import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Users, UserPlus, Loader2, Mail, ChevronDown, ChevronRight, BarChart2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ company_name: '', email: '', contact_person: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedCaps, setExpandedCaps] = useState({});
  const [capsData, setCapsData] = useState({});
  const [loadingCaps, setLoadingCaps] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [onboardingQueue, setOnboardingQueue] = useState([]);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [updatingOnboarding, setUpdatingOnboarding] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleCaps = async (supplierId) => {
    if (expandedCaps[supplierId]) {
      setExpandedCaps(prev => ({ ...prev, [supplierId]: false }));
      return;
    }
    setLoadingCaps(prev => ({ ...prev, [supplierId]: true }));
    const { data } = await supabase
      .from('supplier_capabilities')
      .select('*')
      .eq('supplier_id', supplierId)
      .maybeSingle();
    setCapsData(prev => ({ ...prev, [supplierId]: data || null }));
    setLoadingCaps(prev => ({ ...prev, [supplierId]: false }));
    setExpandedCaps(prev => ({ ...prev, [supplierId]: true }));
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'supplier').order('created_at', { ascending: false });
    setSuppliers(data || []);
    setLoading(false);
  };

  const fetchOnboardingQueue = async () => {
    setOnboardingLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'supplier')
      .in('onboarding_status', ['docs_submitted', 'under_review'])
      .order('created_at', { ascending: false });
    setOnboardingQueue(data || []);
    setOnboardingLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
    fetchOnboardingQueue();
  }, []);

  const updateOnboardingStatus = async (supplierId, status) => {
    setUpdatingOnboarding(supplierId + status);
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_status: status })
      .eq('id', supplierId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: status === 'approved' ? 'Supplier Approved' : 'Supplier Rejected', description: `Onboarding status updated.` });
      fetchOnboardingQueue();
    }
    setUpdatingOnboarding(null);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
       // 1. Create Profile (Assuming trigger handles auth user creation or we do it via edge function in real scenario)
       // Here we just insert to profiles as per instruction, but typically you need auth.users first.
       // We'll assume the edge function 'send-supplier-invitation' handles Auth + Profile.
       
       const { error } = await supabase.functions.invoke('invite-user', {
          body: { ...formData, role: 'supplier' }
       });
       
       if (error) throw new Error("Failed to invoke invite function: " + error.message);

       toast({ title: "Invitation Sent", description: `Invite sent to ${formData.email}` });
       setIsDialogOpen(false);
       setFormData({ company_name: '', email: '', contact_person: '', phone: '' });
       fetchSuppliers(); // Refresh list

    } catch (err) {
       // Fallback for demo environment if edge function fails or isn't deployed
       console.error(err);
       toast({ title: "Invitation Error", description: "Could not send invite (Edge function required). Inserting raw profile for demo.", variant: "destructive" });
       
       // Fallback: Just insert profile for demo visibility
       await supabase.from('profiles').insert({
          email: formData.email,
          company_name: formData.company_name,
          role: 'supplier',
          status: 'pending_verification'
       });
       setIsDialogOpen(false);
       fetchSuppliers();
    } finally {
       setSubmitting(false);
    }
  };

  return (
    <ControlCentreLayout>
       <Helmet><title>Supplier Management - Admin</title></Helmet>
       
       <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
             <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                <Users className="text-sky-500" size={32} /> Supplier Management
             </h1>
             <p className="text-slate-400 mt-1">Manage network partners and access.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger asChild>
                <button className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                   <UserPlus size={18} /> Add Supplier
                </button>
             </DialogTrigger>
             <DialogContent className="bg-[#0f172a] border border-slate-800 text-slate-100">
                <DialogHeader>
                   <DialogTitle>Invite New Supplier</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4 mt-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name *</label>
                      <input required value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2" />
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Person</label>
                         <input required value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                         <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2" />
                      </div>
                   </div>
                   <button type="submit" disabled={submitting} className="w-full bg-sky-600 hover:bg-sky-500 py-2 rounded font-bold mt-4 flex justify-center">
                      {submitting ? <Loader2 className="animate-spin" /> : 'Send Invitation'}
                   </button>
                </form>
             </DialogContent>
          </Dialog>
       </div>

       {/* Tabs */}
       <div className="flex gap-2 mb-4">
         {[
           { key: 'all', label: 'All Suppliers' },
           { key: 'onboarding', label: `Onboarding Queue ${onboardingQueue.length > 0 ? `(${onboardingQueue.length})` : ''}` },
         ].map(tab => (
           <button
             key={tab.key}
             onClick={() => setActiveTab(tab.key)}
             className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
               activeTab === tab.key
                 ? 'bg-sky-600 text-white'
                 : 'bg-slate-800 text-slate-400 hover:text-slate-200'
             }`}
           >
             {tab.label}
           </button>
         ))}
       </div>

       {activeTab === 'onboarding' && (
         <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden mb-4">
           {onboardingLoading ? (
             <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-sky-500" /></div>
           ) : onboardingQueue.length === 0 ? (
             <div className="p-8 text-center text-slate-400 text-sm">No suppliers pending onboarding review.</div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left min-w-[500px]">
                 <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                   <tr>
                     <th className="p-4">Company</th>
                     <th className="p-4">Email</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800 text-slate-300">
                   {onboardingQueue.map(s => (
                     <tr key={s.id} className="hover:bg-slate-900/50">
                       <td className="p-4 font-bold text-white">{s.company_name || s.email}</td>
                       <td className="p-4">{s.email}</td>
                       <td className="p-4">
                         <span className="px-2 py-1 rounded text-xs uppercase font-bold bg-amber-950 text-amber-400">
                           {s.onboarding_status?.replace(/_/g, ' ') || 'Pending'}
                         </span>
                       </td>
                       <td className="p-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button
                             onClick={() => updateOnboardingStatus(s.id, 'approved')}
                             disabled={!!updatingOnboarding}
                             className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 disabled:opacity-50 transition-colors"
                           >
                             {updatingOnboarding === s.id + 'approved' ? <Loader2 size={12} className="animate-spin" /> : null}
                             Approve
                           </button>
                           <button
                             onClick={() => updateOnboardingStatus(s.id, 'rejected')}
                             disabled={!!updatingOnboarding}
                             className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950 text-red-400 hover:bg-red-900 border border-red-800 disabled:opacity-50 transition-colors"
                           >
                             {updatingOnboarding === s.id + 'rejected' ? <Loader2 size={12} className="animate-spin" /> : null}
                             Reject
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </div>
       )}

       <div className={`bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden ${activeTab !== 'all' ? 'hidden' : ''}`}>
          {loading ? (
             <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-sky-500" /></div>
          ) : (
             <div className="overflow-x-auto">
             <table className="w-full text-left min-w-[500px]">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                   <tr>
                      <th className="p-4">Company</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                   {suppliers.map(s => (
                      <React.Fragment key={s.id}>
                        <tr className="hover:bg-slate-900/50">
                           <td className="p-4 font-bold text-white">{s.company_name}</td>
                           <td className="p-4">{s.email}</td>
                           <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${s.status === 'active' ? 'bg-emerald-950 text-emerald-500' : 'bg-amber-950 text-amber-500'}`}>
                                 {s.status || 'Pending'}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => toggleCaps(s.id)}
                                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                  title="View Capabilities"
                                >
                                  {loadingCaps[s.id] ? <Loader2 size={12} className="animate-spin" /> : expandedCaps[s.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  Capabilities
                                </button>
                                <button
                                  onClick={() => navigate('/control-centre/supplier-scorecard')}
                                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                  title="View Scorecard"
                                >
                                  <BarChart2 size={12} /> Scorecard
                                </button>
                                <button className="text-sky-400 hover:text-white p-2"><Mail size={16} /></button>
                              </div>
                           </td>
                        </tr>
                        {expandedCaps[s.id] && (
                          <tr className="bg-slate-950/50">
                            <td colSpan={4} className="px-6 py-4">
                              {capsData[s.id] ? (
                                <div className="space-y-2 text-xs text-slate-400">
                                  {capsData[s.id].processes?.length > 0 && (
                                    <div><span className="font-bold text-slate-300 mr-2">Processes:</span>{capsData[s.id].processes.join(', ')}</div>
                                  )}
                                  {capsData[s.id].materials?.length > 0 && (
                                    <div><span className="font-bold text-slate-300 mr-2">Materials:</span>{capsData[s.id].materials.join(', ')}</div>
                                  )}
                                  {capsData[s.id].certifications?.length > 0 && (
                                    <div><span className="font-bold text-slate-300 mr-2">Certifications:</span>{capsData[s.id].certifications.join(', ')}</div>
                                  )}
                                  <div className="flex gap-6">
                                    {capsData[s.id].min_order_qty != null && <span><span className="font-bold text-slate-300 mr-1">Min Qty:</span>{capsData[s.id].min_order_qty}</span>}
                                    {capsData[s.id].max_order_qty != null && <span><span className="font-bold text-slate-300 mr-1">Max Qty:</span>{capsData[s.id].max_order_qty}</span>}
                                    {capsData[s.id].lead_time_days != null && <span><span className="font-bold text-slate-300 mr-1">Lead Time:</span>{capsData[s.id].lead_time_days} days</span>}
                                    {capsData[s.id].country && <span><span className="font-bold text-slate-300 mr-1">Location:</span>{[capsData[s.id].country, capsData[s.id].region].filter(Boolean).join(', ')}</span>}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic">No capability profile submitted yet.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                   ))}
                </tbody>
             </table>
             </div>
          )}
       </div>
    </ControlCentreLayout>
  );
};

export default SupplierManagementPage;