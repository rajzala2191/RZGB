import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, User, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('info'); // 'info' | 'chat'
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '' });
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const agentMessages = messages.filter(m => m.sender_type === 'agent' && !m.read_by_visitor);
      setUnreadCount(agentMessages.length);
    } else {
      setUnreadCount(0);
    }
  }, [isOpen, messages]);

  const subscribeToMessages = (sid) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`chat_session_${sid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `session_id=eq.${sid}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const startSession = async (e) => {
    e.preventDefault();
    if (!visitorInfo.name.trim()) return;

    setSending(true);
    try {
      const { data: session, error } = await supabase
        .from('live_chat_sessions')
        .insert({
          visitor_name: visitorInfo.name.trim(),
          visitor_email: visitorInfo.email.trim() || null,
          status: 'open',
          page_url: window.location.href,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert the automated greeting (non-fatal if it fails)
      const { error: greetingError } = await supabase.from('live_chat_messages').insert({
        session_id: session.id,
        sender_type: 'agent',
        message: `Hi ${visitorInfo.name}! 👋 Welcome to RZ Global Solutions. How can we help you today?`,
        read_by_visitor: false,
      });
      if (greetingError) console.error('Greeting insert error:', greetingError);

      setSessionId(session.id);
      const { data: msgs } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });
      setMessages(msgs || []);
      subscribeToMessages(session.id);
      setStep('chat');
    } catch (err) {
      console.error('Chat session error:', err);
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || !sessionId || sending) return;

    setSending(true);
    setInputValue('');
    try {
      await supabase.from('live_chat_messages').insert({
        session_id: sessionId,
        sender_type: 'visitor',
        message: text,
        read_by_visitor: true,
      });
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    setIsOpen(false);
    if (sessionId) {
      const { error } = await supabase
        .from('live_chat_sessions')
        .update({ status: 'closed' })
        .eq('id', sessionId);
      if (error) console.error('Session close error:', error);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setSessionId(null);
      setMessages([]);
      setStep('info');
      setVisitorInfo({ name: '', email: '' });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="w-80 sm:w-96 bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '520px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                <span className="text-white font-semibold text-sm">RZ Global Solutions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-100 text-xs">Live Support</span>
                <button
                  onClick={handleClose}
                  className="text-white hover:text-cyan-100 transition-colors"
                  aria-label="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {step === 'info' ? (
              /* Visitor info form */
              <form onSubmit={startSession} className="flex flex-col flex-1 p-4 gap-4">
                <div>
                  <p className="text-slate-300 text-sm mb-4">
                    Welcome! 👋 Please tell us your name to get started.
                  </p>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={visitorInfo.name}
                    onChange={(e) => setVisitorInfo({ ...visitorInfo, name: e.target.value })}
                    placeholder="John Smith"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Email Address <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={visitorInfo.email}
                    onChange={(e) => setVisitorInfo({ ...visitorInfo, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !visitorInfo.name.trim()}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                  Start Chat
                </button>
              </form>
            ) : (
              /* Chat window */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '280px', maxHeight: '340px' }}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'visitor' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender_type === 'agent' && (
                        <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                          <User size={14} className="text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                          msg.sender_type === 'visitor'
                            ? 'bg-cyan-600 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-3 border-t border-slate-700 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputValue.trim()}
                    className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-lg text-white transition-colors"
                    aria-label="Send message"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-14 h-14 bg-cyan-600 hover:bg-cyan-500 rounded-full shadow-lg flex items-center justify-center text-white transition-colors"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open live chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={24} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle size={24} />
            </motion.span>
          )}
        </AnimatePresence>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default LiveChatWidget;
