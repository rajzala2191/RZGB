import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { fetchQuestionsForOrder, answerQuestion } from '@/services/rfqService';
import { fetchOrderById } from '@/services/orderService';
import { format } from 'date-fns';
import {
  MessageCircleQuestion, ArrowLeft, Send, Building2,
  CheckCircle2, Clock, Loader2,
} from 'lucide-react';

export default function RFQQandAPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState({});
  const [answering, setAnswering] = useState(null);

  useEffect(() => { loadData(); }, [orderId]);

  const loadData = async () => {
    setLoading(true);
    const [orderRes, qRes] = await Promise.all([
      fetchOrderById(orderId),
      fetchQuestionsForOrder(orderId),
    ]);
    if (orderRes.data) setOrder(orderRes.data);
    if (qRes.data) setQuestions(qRes.data);
    setLoading(false);
  };

  const handleAnswer = async (qId) => {
    const text = answerText[qId];
    if (!text?.trim()) return;
    setAnswering(qId);
    try {
      const { error } = await answerQuestion(qId, text.trim(), currentUser.id);
      if (error) throw error;
      toast({ title: 'Answer Posted', description: 'Visible to all bidding suppliers.' });
      setAnswerText(prev => ({ ...prev, [qId]: '' }));
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAnswering(null);
    }
  };

  return (
    <ControlCentreLayout>
      <div className="max-w-4xl mx-auto space-y-5 pb-10">
        <button onClick={() => navigate('/control-centre/bid-management')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-orange-500 transition-colors">
          <ArrowLeft size={14} /> Back to Bid Management
        </button>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">RFQ Enhancement</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">
            Q&A Board{order ? ` — ${order.ghost_public_name || order.part_name}` : ''}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Supplier questions and admin answers — visible to all bidders.</p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" /> Loading…</div>
        ) : questions.length === 0 ? (
          <div className="py-20 text-center">
            <MessageCircleQuestion className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No questions yet.</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Suppliers can ask questions from their Bidding Centre.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map(q => (
              <div key={q.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{q.asker?.company_name || 'Supplier'}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{format(new Date(q.created_at), 'dd MMM yyyy HH:mm')}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-slate-300">{q.question}</p>
                    </div>
                  </div>

                  {q.answer ? (
                    <div className="ml-11 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Admin Answer</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{q.answered_at && format(new Date(q.answered_at), 'dd MMM yyyy HH:mm')}</span>
                      </div>
                      <p className="text-sm text-emerald-800 dark:text-emerald-300">{q.answer}</p>
                    </div>
                  ) : (
                    <div className="ml-11 flex gap-2">
                      <textarea
                        value={answerText[q.id] || ''}
                        onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Type your answer…"
                        rows={2}
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                      <Button onClick={() => handleAnswer(q.id)} disabled={answering === q.id || !answerText[q.id]?.trim()}
                        className="bg-orange-600 hover:bg-orange-500 text-white self-end">
                        {answering === q.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
}
