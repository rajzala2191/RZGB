import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { fetchDemoRequests, approveDemoRequest, rejectDemoRequest } from '@/services/demoRequestService';
import { format } from 'date-fns';
import { Mail, CheckCircle2, XCircle, Loader2, Send } from 'lucide-react';

export default function PlatformDemoRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchDemoRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setRequests([]);
      toast({ title: 'Error', description: e?.message || 'Failed to load demo requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await approveDemoRequest(id);
      toast({ title: 'Approved', description: 'Demo access email has been sent to the requester.' });
      load();
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to approve', variant: 'destructive' });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    setRejectingId(id);
    try {
      await rejectDemoRequest(id);
      toast({ title: 'Rejected', description: 'Demo request has been rejected.' });
      load();
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to reject', variant: 'destructive' });
    } finally {
      setRejectingId(null);
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const approved = requests.filter((r) => r.status === 'approved');
  const rejected = requests.filter((r) => r.status === 'rejected');

  return (
    <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Demo access</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Demo requests</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Approve requests to send a demo link by email. Rejected requests do not receive an email.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Pending ({pending.length})
                </h2>
                <div className="space-y-2">
                  {pending.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">{r.email}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          Requested {format(new Date(r.requested_at), 'dd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(r.id)}
                          disabled={approvingId !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {approvingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Approve & send link
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          disabled={rejectingId !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          {rejectingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(approved.length > 0 || rejected.length > 0) && (
              <section>
                <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-3">History</h2>
                <div className="space-y-2">
                  {[...approved, ...rejected]
                    .sort((a, b) => new Date(b.updated_at || b.requested_at) - new Date(a.updated_at || a.requested_at))
                    .map((r) => (
                      <div
                        key={r.id}
                        className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{r.email}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            r.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {r.status === 'approved' ? 'Approved' : 'Rejected'}
                          {r.approved_at && r.status === 'approved' && ` · ${format(new Date(r.approved_at), 'dd MMM yyyy')}`}
                        </span>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {requests.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-slate-400 py-8">No demo requests yet.</p>
            )}
          </>
        )}
      </div>
  );
}
