import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/lib/createNotification';
import { LifeBuoy, Send, Loader2, Mail, Phone, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { TICKET_CATEGORIES, getStatusColor, getPriorityColor } from '@/lib/ticketHelpers';

const SupplierSupportPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ subject: '', category: TICKET_CATEGORIES[0], message: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) return;
    setSubmitting(true);
    try {
      const { data: newTicket, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: currentUser.id,
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
          status: 'open',
          user_role: 'supplier',
        })
        .select()
        .single();

      if (error) throw error;

      // Notify admins
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins?.length) {
        await createNotification({
          recipientId: admins.map(a => a.id),
          senderId: currentUser.id,
          type: 'support_ticket',
          title: 'New Supplier Support Ticket',
          message: `New ticket: "${formData.subject}"`,
          link: `/control-centre/support/${newTicket.id}`,
        });
      }

      // Email notification (graceful fail)
      supabase.functions.invoke('send-ticket-email', {
        body: {
          subject: formData.subject,
          category: formData.category,
          ticketId: newTicket.id,
          senderRole: 'supplier',
        },
      }).catch(() => {});

      toast({ title: 'Ticket Submitted', description: 'Our support team has been notified.' });
      setFormData({ subject: '', category: TICKET_CATEGORIES[0], message: '' });
      fetchTickets();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SupplierHubLayout>
      <Helmet><title>Support - Supplier Hub</title></Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <LifeBuoy className="text-cyan-500" size={32} /> Support Center
        </h1>
        <p className="text-slate-400 mt-1">Raise a support request and our team will get back to you.</p>
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
                <p>Mon–Fri: 09:00–18:00 GMT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form + History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-6">Create New Ticket</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject *</label>
                  <input
                    required
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="Brief summary of issue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {TICKET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 min-h-[120px] focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Describe your issue in detail..."
                />
              </div>
              <button
                disabled={submitting}
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
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
                  <div
                    key={t.id}
                    onClick={() => navigate(`/supplier-hub/support/${t.id}`)}
                    className="p-4 hover:bg-slate-900/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-slate-200 truncate">{t.subject}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(t.status)}`}>{t.status}</span>
                        {t.priority && <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(t.priority)}`}>{t.priority}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{t.category}</span>
                        <span>•</span>
                        <span>{format(new Date(t.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 flex-shrink-0 ml-3" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SupplierHubLayout>
  );
};

export default SupplierSupportPage;
