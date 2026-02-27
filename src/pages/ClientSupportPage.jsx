import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { LifeBuoy, Send, MessageSquare, Loader2, Phone, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const ClientSupportPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ subject: '', category: 'General', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    if (!currentUser) return;
    // Updated to use user_id instead of client_id
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) return;
    setSubmitting(true);
    
    try {
       // Updated to use user_id instead of client_id
       const { error } = await supabase.from('support_tickets').insert({
          user_id: currentUser.id,
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
          status: 'open'
       });

       if (error) throw error;
       
       toast({ title: "Ticket Submitted", description: "Our support team has been notified." });
       setFormData({ subject: '', category: 'General', message: '' });
       fetchTickets();
       
       // Audit log
       await supabase.from('audit_logs').insert({
          user_id: currentUser.id,
          action: 'SUPPORT_TICKET_CREATED',
          details: `Ticket subject: ${formData.subject}`,
          status: 'success'
       });
    } catch (err) {
       toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
       setSubmitting(false);
    }
  };

  return (
    <ClientDashboardLayout>
      <Helmet><title>Support - Client Portal</title></Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
           <LifeBuoy className="text-cyan-500" size={32} /> Support Center
        </h1>
        <p className="text-slate-400 mt-1">We're here to help with your orders and platform questions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Contact Info */}
         <div className="space-y-6">
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6">
               <h3 className="font-bold text-white mb-4">Contact Information</h3>
               <div className="space-y-4 text-slate-400 text-sm">
                  <div className="flex items-center gap-3">
                     <Mail className="text-cyan-500" size={18} />
                     <span>support@rzglobal.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <Phone className="text-cyan-500" size={18} />
                     <span>+44 20 1234 5678</span>
                  </div>
                  <div className="pt-4 border-t border-slate-800">
                     <p className="font-bold text-slate-300">Support Hours</p>
                     <p>Mon-Fri: 09:00 - 18:00 GMT</p>
                  </div>
               </div>
            </div>
         </div>

         {/* New Ticket Form */}
         <div className="lg:col-span-2">
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 mb-8">
               <h3 className="font-bold text-white mb-6">Create New Ticket</h3>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject *</label>
                        <input 
                           required
                           value={formData.subject}
                           onChange={e => setFormData({...formData, subject: e.target.value})}
                           className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
                           placeholder="Brief summary of issue"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                        <select 
                           value={formData.category}
                           onChange={e => setFormData({...formData, category: e.target.value})}
                           className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
                        >
                           <option>General Inquiry</option>
                           <option>Technical Issue</option>
                           <option>Billing Question</option>
                           <option>Order Update</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message *</label>
                     <textarea 
                        required
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 min-h-[120px]"
                        placeholder="Describe your issue in detail..."
                     />
                  </div>
                  <button 
                     disabled={submitting}
                     type="submit" 
                     className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                     {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                     Submit Ticket
                  </button>
               </form>
            </div>

            {/* Ticket History */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
               <div className="p-4 border-b border-slate-800 font-bold text-slate-300">My Tickets</div>
               {loading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>
               ) : tickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No support history.</div>
               ) : (
                  <div className="divide-y divide-slate-800">
                     {tickets.map(t => (
                        <div key={t.id} className="p-4 hover:bg-slate-900/50 transition-colors">
                           <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-slate-200">{t.subject}</span>
                              <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${t.status === 'open' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                 {t.status}
                              </span>
                           </div>
                           <div className="flex justify-between items-center text-xs text-slate-500">
                              <span>{t.category}</span>
                              <span>{format(new Date(t.created_at), 'MMM dd, yyyy')}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientSupportPage;