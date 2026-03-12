import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import { Send, User, Shield, Users } from 'lucide-react';

// Helper to get role badge/icon
const roleBadge = (role) => {
  if (role === 'admin') return <Shield size={14} className="text-orange-500" title="Admin" />;
  if (role === 'client') return <User size={14} className="text-blue-500" title="Client" />;
  if (role === 'supplier') return <Users size={14} className="text-green-500" title="Supplier" />;
  return <User size={14} className="text-gray-400" title={role} />;
};

export default function OrderMessageThread({ orderId }) {
  const { currentUser, userRole } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (!error) setMessages(data || []);
      setLoading(false);
    };
    fetchMessages();
    // Subscribe to realtime updates
    const channel = supabase.channel(`order-messages-${orderId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_messages', filter: `order_id=eq.${orderId}` }, fetchMessages)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [orderId]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('order_messages').insert({
        order_id: orderId,
        sender_id: currentUser.id,
        sender_role: userRole,
        body: newMsg.trim(),
      });
      if (error) throw error;
      setNewMsg('');
    } catch (err) {
      // Optionally show error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[500px] border rounded-xl bg-white dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">No messages yet.</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 items-start ${msg.sender_id === currentUser.id ? 'justify-end' : ''}`}>
              {msg.sender_id !== currentUser.id && (
                <div className="flex flex-col items-center mt-1">{roleBadge(msg.sender_role)}</div>
              )}
              <div className={`rounded-lg px-3 py-2 max-w-xs break-words ${msg.sender_id === currentUser.id ? 'bg-orange-100 dark:bg-orange-900 text-right' : 'bg-gray-100 dark:bg-slate-800'}`}>
                <div className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1">
                  {msg.sender_role.charAt(0).toUpperCase() + msg.sender_role.slice(1)}
                  <span className="text-[10px] text-gray-400 ml-1">{format(new Date(msg.created_at), 'dd MMM HH:mm')}</span>
                </div>
                <div className="text-sm text-gray-900 dark:text-slate-100 whitespace-pre-line">{msg.body}</div>
              </div>
              {msg.sender_id === currentUser.id && (
                <div className="flex flex-col items-center mt-1">{roleBadge(msg.sender_role)}</div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t bg-gray-50 dark:bg-slate-800">
        <input
          type="text"
          className="flex-1 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-orange-500"
          placeholder="Type a message…"
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-1" disabled={sending || !newMsg.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
