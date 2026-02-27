import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Users, UserPlus, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ company_name: '', email: '', contact_person: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'supplier').order('created_at', { ascending: false });
    setSuppliers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSuppliers(); }, []);

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
       
       <div className="mb-8 flex justify-between items-center">
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
                   <div className="grid grid-cols-2 gap-4">
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

       <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
             <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-sky-500" /></div>
          ) : (
             <table className="w-full text-left">
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
                      <tr key={s.id} className="hover:bg-slate-900/50">
                         <td className="p-4 font-bold text-white">{s.company_name}</td>
                         <td className="p-4">{s.email}</td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${s.status === 'active' ? 'bg-emerald-950 text-emerald-500' : 'bg-amber-950 text-amber-500'}`}>
                               {s.status || 'Pending'}
                            </span>
                         </td>
                         <td className="p-4 text-right">
                            <button className="text-sky-400 hover:text-white p-2"><Mail size={16} /></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          )}
       </div>
    </ControlCentreLayout>
  );
};

export default SupplierManagementPage;