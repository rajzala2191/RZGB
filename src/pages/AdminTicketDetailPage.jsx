import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/lib/createNotification';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { ArrowLeft, Send, Loader2, User, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { getPriorityColor, getStatusColor, TICKET_PRIORITIES, TICKET_STATUSES } from '@/lib/ticketHelpers';
import { useToast } from '@/components/ui/use-toast';

export default function AdminTicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [submitter, setSubmitter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [localPriority, setLocalPriority] = useState('medium');
  const [localStatus, setLocalStatus] = useState('open');

  const fetchAll = async () => {
    try {
      const { data: t, error: tErr } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      if (tErr) throw tErr;
      setTicket(t);
      setLocalPriority(t.priority || 'medium');
      setLocalStatus(t.status || 'open');

      // Fetch submitter profile
      if (t.user_id) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('company_name, role, email')
          .eq('id', t.user_id)
          .maybeSingle();
        setSubmitter(profile);
      }

      const { data: r } = await supabaseAdmin
        .from('ticket_replies')
        .select('*, profiles:user_id(company_name, role)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      setReplies(r || []);
    } catch (err) {
      console.error('AdminTicketDetailPage fetch error:', err);
      toast({ title: 'Error', description: 'Failed to load ticket.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [ticketId]);

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    try {
      const { error } = await supabaseAdmin
        .from('support_tickets')
        .update({ priority: localPriority, status: localStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      if (error) throw error;
      setTicket(prev => ({ ...prev, priority: localPriority, status: localStatus }));
      toast({ title: 'Updated', description: 'Ticket status and priority saved.' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingMeta(false);
    }
  };

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
          is_admin_reply: true,
        });
      if (error) throw error;

      // Update ticket updated_at
      await supabaseAdmin
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      // In-app notification to ticket owner
      if (ticket?.user_id) {
        await createNotification({
          recipientId: ticket.user_id,
          senderId: currentUser.id,
          type: 'support_reply',
          title: 'Support Reply',
          message: `Admin replied to your ticket: "${ticket.subject}"`,
          link: ticket.user_role === 'supplier'
            ? `/supplier-hub/support/${ticketId}`
            : `/client-dashboard/support/${ticketId}`,
        });
      }

      // Email notification (graceful fail)
      supabase.functions.invoke('send-ticket-email', {
        body: {
          to: submitter?.email,
          subject: `Re: ${ticket?.subject}`,
          replyMessage: replyText.trim(),
          ticketId,
        },
      }).catch(() => {});

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
      <ControlCentreLayout>
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500 w-10 h-10" /></div>
      </ControlCentreLayout>
    );
  }

  if (!ticket) {
    return (
      <ControlCentreLayout>
        <div className="p-8 text-slate-400">Ticket not found.</div>
      </ControlCentreLayout>
    );
  }

  return (
    <ControlCentreLayout>
      <Helmet><title>Ticket #{ticketId.slice(0, 8)} — Admin</title></Helmet>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate('/control-centre/support')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold transition-colors"
        >
          <ArrowLeft size={16} /> Back to Support
        </button>

        {/* Header */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{ticket.subject}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                <span className="font-mono">#{ticket.id.slice(0, 8)}</span>
                <span>•</span>
                <span>{ticket.category}</span>
                <span>•</span>
                <span>{format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getPriorityColor(ticket.priority || 'medium')}`}>
                {ticket.priority || 'medium'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thread */}
          <div className="lg:col-span-2 space-y-4">
            {/* Original message */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                  {submitter?.company_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{submitter?.company_name || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{submitter?.role || 'client'} • Original message</p>
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
                      {reply.is_admin_reply ? 'RZ Support Team' : (reply.profiles?.company_name || 'User')}
                    </p>
                    <p className="text-[10px] text-slate-500">{format(new Date(reply.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}

            {/* Reply Form */}
            <form onSubmit={handleReply} className="bg-[#0f172a] border border-cyan-800/40 rounded-xl p-5">
              <p className="text-sm font-bold text-slate-300 mb-3">Reply as Admin</p>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-5 rounded-lg text-sm disabled:opacity-50 transition-colors"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Reply
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Submitter Info */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase mb-4">Submitted By</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Company</p>
                  <p className="text-slate-200 font-semibold">{submitter?.company_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Role</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    submitter?.role === 'supplier'
                      ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'
                      : 'bg-blue-900/30 text-blue-400 border-blue-800/50'
                  }`}>
                    {submitter?.role || 'client'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Email</p>
                  <p className="text-slate-300 text-sm font-mono truncate">{submitter?.email || '—'}</p>
                </div>
              </div>
            </div>

            {/* Manage Ticket */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase mb-4">Manage Ticket</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase mb-1">Status</label>
                  <select
                    value={localStatus}
                    onChange={e => setLocalStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {TICKET_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase mb-1">Priority</label>
                  <select
                    value={localPriority}
                    onChange={e => setLocalPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {TICKET_PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSaveMeta}
                  disabled={savingMeta}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 border border-slate-700"
                >
                  {savingMeta ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ControlCentreLayout>
  );
}
