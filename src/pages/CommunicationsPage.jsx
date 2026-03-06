import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { useToast } from '@/components/ui/use-toast';
import { Send, Clock, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const CommunicationsPage = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    recipients: 'all',
    schedule: false,
    scheduled_at: ''
  });

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      const newMessage = {
        title: formData.title,
        body: formData.body,
        recipients: formData.recipients,
        status: formData.schedule ? 'Scheduled' : 'Sent',
        scheduled_at: formData.schedule ? new Date(formData.scheduled_at) : null,
        sent_at: formData.schedule ? null : new Date(),
      };

      const { error } = await supabase.from('messages').insert(newMessage);
      if (error) throw error;

      toast({
        title: formData.schedule ? "Message Scheduled" : "Message Sent",
        description: "Your communication has been processed successfully.",
        className: "bg-green-600 border-green-700 text-white"
      });

      setFormData({
        title: '',
        body: '',
        recipients: 'all',
        schedule: false,
        scheduled_at: ''
      });
      
      fetchMessages();

    } catch (err) {
      console.error('Send error:', err);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>Communications - RZ Global Solutions</title>
      </Helmet>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Column */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Send size={20} className="text-[#FF6B35]" />
              Compose Message
            </h2>
            
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Title / Subject</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF6B35]"
                  placeholder="Important System Update"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Recipients</label>
                <select
                  value={formData.recipients}
                  onChange={e => setFormData({...formData, recipients: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF6B35]"
                >
                  <option value="all">All Users</option>
                  <option value="admins">Admins Only</option>
                  <option value="clients">Clients Only</option>
                  <option value="suppliers">Suppliers Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Message Body</label>
                <textarea
                  required
                  rows={6}
                  value={formData.body}
                  onChange={e => setFormData({...formData, body: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF6B35] resize-none"
                  placeholder="Type your message here..."
                />
              </div>

              <div className="border-t border-gray-800 pt-4">
                 <div className="flex items-center gap-2 mb-3">
                   <input
                    type="checkbox"
                    id="schedule"
                    checked={formData.schedule}
                    onChange={e => setFormData({...formData, schedule: e.target.checked})}
                    className="rounded border-gray-700 bg-gray-900 text-[#FF6B35] focus:ring-[#FF6B35]"
                   />
                   <label htmlFor="schedule" className="text-sm text-gray-300">Schedule for later</label>
                 </div>
                 
                 {formData.schedule && (
                   <input
                    required
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={e => setFormData({...formData, scheduled_at: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF6B35] mb-4 text-sm"
                   />
                 )}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-[#FF6B35] hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                {formData.schedule ? 'Schedule Message' : 'Send Now'}
              </button>
            </form>
          </div>
        </div>

        {/* History Column */}
        <div className="lg:col-span-2">
           <h2 className="text-2xl font-bold text-white mb-6">Message History</h2>
           
           <div className="space-y-4">
             {loading ? (
               <div className="text-center py-10 text-gray-500">Loading history...</div>
             ) : messages.length === 0 ? (
               <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                 No messages sent yet.
               </div>
             ) : (
               messages.map((msg) => (
                 <div key={msg.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{msg.title}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <Clock size={12} /> 
                          {msg.sent_at 
                            ? `Sent: ${format(new Date(msg.sent_at), 'PPp')}` 
                            : `Scheduled: ${format(new Date(msg.scheduled_at), 'PPp')}`
                          }
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        msg.status === 'Sent' ? 'bg-green-900/30 text-green-500' : 'bg-yellow-900/30 text-yellow-500'
                      }`}>
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{msg.body}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-800 pt-3">
                       <span className="flex items-center gap-1">
                         <Users size={12} /> To: <span className="text-gray-300 capitalize">{msg.recipients}</span>
                       </span>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </ControlCentreLayout>
  );
};

export default CommunicationsPage;