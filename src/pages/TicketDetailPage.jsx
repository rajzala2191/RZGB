import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/lib/createNotification';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { ArrowLeft, Send, Loader2, User, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { getStatusColor, getPriorityColor } from '@/lib/ticketHelpers';
import { useToast } from '@/components/ui/use-toast';

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const { toast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const isSupplier = userRole === 'supplier';
  const backPath = isSupplier ? '/supplier-hub/support' : '/client-dashboard/support';
  const Layout = isSupplier ? SupplierHubLayout : ClientDashboardLayout;

  const fetchAll = async () => {
    try {
      const { data: t, error: tErr } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .eq('user_id', currentUser.id)
        .maybeSingle();
      if (tErr) throw tErr;
      setTicket(t);

      if (t) {
        const { data: r } = await supabaseAdmin
          .from('ticket_replies')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });
        setReplies(r || []);
      }
    } catch (err) {
      console.error('TicketDetailPage fetch error:', err);
      toast({ title: 'Error', description: 'Failed to load ticket.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchAll();
  }, [ticketId, currentUser]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: ticketId,
          user_id: currentUser.id,
          message: replyText.trim(),
          is_admin_reply: false,
        });
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
          type: 'support_reply',
          title: 'Ticket Reply',
          message: `${userRole === 'supplier' ? 'Supplier' : 'Client'} replied to ticket: "${ticket?.subject}"`,
          link: `/control-centre/support/${ticketId}`,
        });
      }

      setReplyText('');
      fetchAll();
      toast({ title: 'Reply sent' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500 w-10 h-10" /></div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="p-8 text-slate-400">Ticket not found or access denied.</div>
      </Layout>
    );
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <Layout>
      <Helmet><title>Ticket — Support</title></Helmet>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold transition-colors"
        >
          <ArrowLeft size={16} /> Back to Support
        </button>

        {/* Header */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-100">{ticket.subject}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                <span className="font-mono">#{ticket.id.slice(0, 8)}</span>
                <span>•</span>
                <span>{ticket.category}</span>
                <span>•</span>
                <span>{format(new Date(ticket.created_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
              {ticket.priority && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Original message */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs">
              <User size={14} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">You</p>
              <p className="text-[10px] text-slate-500">Original message</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
        </div>

        {/* Replies */}
        {replies.map(reply => (
          <div
            key={reply.id}
            className={`border rounded-xl p-5 ${
              reply.is_admin_reply
                ? 'bg-cyan-950/20 border-cyan-800/40 ml-4'
                : 'bg-[#0f172a] border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                reply.is_admin_reply
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                  : 'bg-gradient-to-br from-slate-500 to-slate-700'
              }`}>
                {reply.is_admin_reply ? <ShieldCheck size={14} /> : <User size={14} />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">
                  {reply.is_admin_reply ? 'RZ Support Team' : 'You'}
                </p>
                <p className="text-[10px] text-slate-500">{format(new Date(reply.created_at), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{reply.message}</p>
          </div>
        ))}

        {/* Reply form */}
        {isClosed ? (
          <div className="text-center py-6 text-slate-500 text-sm bg-[#0f172a] border border-slate-800 rounded-xl">
            This ticket is {ticket.status}. Contact support to reopen it.
          </div>
        ) : (
          <form onSubmit={handleReply} className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
            <p className="text-sm font-bold text-slate-300 mb-3">Add a Reply</p>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-5 rounded-lg text-sm disabled:opacity-50 transition-colors"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
