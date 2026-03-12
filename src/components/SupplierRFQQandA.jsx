import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { fetchQuestionsForOrder, askQuestion } from '@/services/rfqService';
import { format } from 'date-fns';
import {
  MessageCircleQuestion, Send, CheckCircle2, Building2, Loader2,
} from 'lucide-react';

export default function SupplierRFQQandA({ orderId }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (orderId) loadQuestions(); }, [orderId]);

  const loadQuestions = async () => {
    setLoading(true);
    const { data } = await fetchQuestionsForOrder(orderId);
    if (data) setQuestions(data);
    setLoading(false);
  };

  const handleAsk = async () => {
    if (!newQuestion.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await askQuestion({ orderId, askedBy: currentUser.id, question: newQuestion.trim() });
      if (error) throw error;
      toast({ title: 'Question Submitted', description: 'Admin will respond shortly.' });
      setNewQuestion('');
      loadQuestions();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircleQuestion size={16} className="text-orange-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">RFQ Q&A</h3>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Loading questions…</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {questions.map(q => (
            <div key={q.id} className="bg-gray-50 dark:bg-[#232329] rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 size={11} className="text-blue-500" />
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{q.asker?.company_name || 'Supplier'}</span>
                <span className="text-[10px] text-gray-400">{format(new Date(q.created_at), 'dd MMM HH:mm')}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-slate-300">{q.question}</p>
              {q.answer && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 mt-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <CheckCircle2 size={10} className="text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Admin</span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">{q.answer}</p>
                </div>
              )}
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500">No questions yet. Be the first to ask!</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={newQuestion}
          onChange={e => setNewQuestion(e.target.value)}
          placeholder="Ask a question about this tender…"
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500"
        />
        <Button onClick={handleAsk} disabled={submitting || !newQuestion.trim()}
          className="bg-orange-600 hover:bg-orange-500 text-white self-end">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </Button>
      </div>
    </div>
  );
}
