import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { useToast } from '@/components/ui/use-toast';
import {
  MessageCircle, Send, User, Clock, X, Loader2,
  Circle, CheckCircle2, AlertCircle, Search
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const STATUS_COLORS = {
  open: 'text-green-400',
  closed: 'text-slate-500',
};

const AdminLiveChatPage = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);
  const sessionsChannelRef = useRef(null);
  const messagesChannelRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load all chat sessions
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Fetch sessions error:', err);
      toast({ title: 'Error', description: 'Failed to load chat sessions.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to new/updated sessions
  const subscribeToSessions = () => {
    if (sessionsChannelRef.current) supabase.removeChannel(sessionsChannelRef.current);
    const channel = supabase
      .channel('admin_chat_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_chat_sessions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSessions((prev) => {
            if (prev.find((s) => s.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setSessions((prev) => prev.map((s) => s.id === payload.new.id ? payload.new : s));
        } else {
          fetchSessions();
        }
      })
      .subscribe();
    sessionsChannelRef.current = channel;
  };

  // Load messages for selected session
  const fetchMessages = async (sessionId) => {
    const { data, error } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Fetch messages error:', error);
    } else {
      setMessages(data || []);
    }
  };

  // Subscribe to messages for the currently selected session
  const subscribeToMessages = (sessionId) => {
    if (messagesChannelRef.current) supabase.removeChannel(messagesChannelRef.current);
    const channel = supabase
      .channel(`admin_messages_${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();
    messagesChannelRef.current = channel;
  };

  useEffect(() => {
    fetchSessions();
    subscribeToSessions();
    return () => {
      if (sessionsChannelRef.current) supabase.removeChannel(sessionsChannelRef.current);
      if (messagesChannelRef.current) supabase.removeChannel(messagesChannelRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    fetchMessages(session.id);
    subscribeToMessages(session.id);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || !selectedSession || sending) return;

    setSending(true);
    setReplyText('');
    try {
      const { error } = await supabase.from('live_chat_messages').insert({
        session_id: selectedSession.id,
        sender_type: 'agent',
        message: text,
        read_by_visitor: false,
      });
      if (error) throw error;
    } catch (err) {
      console.error('Reply error:', err);
      toast({ title: 'Error', description: 'Failed to send reply.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleCloseSession = async (sessionId) => {
    const { error } = await supabase
      .from('live_chat_sessions')
      .update({ status: 'closed' })
      .eq('id', sessionId);
    if (error) {
      console.error('Close session error:', error);
      toast({ title: 'Error', description: 'Failed to close session.', variant: 'destructive' });
    } else {
      toast({ title: 'Session Closed', description: 'Chat session has been closed.', className: 'bg-slate-800 border-slate-700 text-white' });
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, status: 'closed' } : s));
      if (selectedSession?.id === sessionId) {
        setSelectedSession((prev) => ({ ...prev, status: 'closed' }));
      }
    }
  };

  const filteredSessions = sessions.filter((s) =>
    !search || s.visitor_name?.toLowerCase().includes(search.toLowerCase()) || s.visitor_email?.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = sessions.filter((s) => s.status === 'open').length;

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>Live Chat - Ghost Portal</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col h-[calc(100vh-8rem)]"
      >
        {/* Page Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageCircle size={24} className="text-cyan-400" />
              Live Chat
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {openCount > 0 ? (
                <span>
                  <span className="text-cyan-400 font-semibold">{openCount}</span> active session{openCount !== 1 ? 's' : ''}
                </span>
              ) : (
                'No active sessions'
              )}
            </p>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          {/* Sessions sidebar */}
          <div className="w-72 flex-shrink-0 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 size={20} className="animate-spin text-cyan-500" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No chat sessions yet.
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`w-full text-left p-3 border-b border-slate-800 hover:bg-slate-800 transition-colors ${
                      selectedSession?.id === session.id ? 'bg-slate-800 border-l-2 border-l-cyan-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white truncate">{session.visitor_name}</p>
                          <Circle
                            size={8}
                            className={`flex-shrink-0 ml-1 ${session.status === 'open' ? 'text-green-400 fill-green-400' : 'text-slate-600 fill-slate-600'}`}
                          />
                        </div>
                        <p className="text-xs text-slate-500 truncate">{session.visitor_email || 'No email'}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden min-w-0">
            {selectedSession ? (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                      <User size={16} className="text-slate-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{selectedSession.visitor_name}</p>
                      <p className="text-xs text-slate-500">
                        {selectedSession.visitor_email || 'No email'} &bull;{' '}
                        <span className={STATUS_COLORS[selectedSession.status] || 'text-slate-400'}>
                          {selectedSession.status}
                        </span>{' '}
                        &bull; Started {format(new Date(selectedSession.created_at), 'dd MMM, HH:mm')}
                      </p>
                    </div>
                  </div>
                  {selectedSession.status === 'open' && (
                    <button
                      onClick={() => handleCloseSession(selectedSession.id)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/30 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900/50 transition-colors"
                    >
                      <X size={13} /> Close Session
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'agent' ? 'justify-start' : 'justify-end'}`}
                    >
                      {msg.sender_type === 'agent' && (
                        <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                          <User size={13} className="text-white" />
                        </div>
                      )}
                      <div className="max-w-[70%]">
                        <div
                          className={`px-3 py-2 rounded-xl text-sm ${
                            msg.sender_type === 'agent'
                              ? 'bg-slate-800 text-slate-200 rounded-bl-sm'
                              : 'bg-cyan-600 text-white rounded-br-sm'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 px-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply input */}
                {selectedSession.status === 'open' ? (
                  <form onSubmit={handleSendReply} className="p-3 border-t border-slate-800 flex items-center gap-2 flex-shrink-0">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a reply..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-lg text-white transition-colors"
                      aria-label="Send reply"
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </form>
                ) : (
                  <div className="p-3 border-t border-slate-800 text-center text-sm text-slate-500 flex-shrink-0">
                    <CheckCircle2 size={14} className="inline mr-1 text-slate-600" /> This session is closed.
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <MessageCircle size={40} className="mb-3 text-slate-700" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1 text-slate-600">Choose a chat session from the list to start responding.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </ControlCentreLayout>
  );
};

export default AdminLiveChatPage;
