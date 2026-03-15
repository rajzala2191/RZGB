import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  UserCheck, X, Loader2, Building2, Mail, Calendar,
  Users, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  ClipboardList,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPendingWorkspaces,
  fetchResolvedJoinlistWorkspaces,
  approveWorkspace,
  rejectWorkspace,
} from '@/services/workspaceService';
import OnboardingDetailsPanel from '@/features/onboarding/OnboardingDetailsPanel';

const BRAND = '#FF6B35';

function StatusBadge({ status }) {
  const styles = {
    active:   { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', label: 'Approved' },
    archived: { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Rejected' },
    pending:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Pending'  },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function WorkspaceCard({ ws, onApprove, onReject, approving, rejecting }) {
  const [expanded, setExpanded] = useState(false);
  const owner = ws.profiles?.[0] || ws.profiles || null;
  const ownerEmail = owner?.email || '—';
  const submitted = ws.onboarding_completed_at
    ? format(new Date(ws.onboarding_completed_at), 'dd MMM yyyy, HH:mm')
    : ws.created_at
    ? format(new Date(ws.created_at), 'dd MMM yyyy')
    : '—';

  const industry  = ws.onboarding_data?.industry    || '—';
  const compSize  = ws.onboarding_data?.companySize || '—';
  const annualSpend = ws.onboarding_data?.annualSpend || '—';

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ border: '1px solid var(--edge)', background: 'var(--surface)' }}
    >
      {/* Main row */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${BRAND}18` }}
              >
                <Building2 size={15} style={{ color: BRAND }} />
              </div>
              <span className="text-base font-bold truncate" style={{ color: 'var(--heading)' }}>
                {ws.name || '—'}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--caption)' }}>
                <Mail size={11} /> {ownerEmail}
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--caption)' }}>
                <Calendar size={11} /> {submitted}
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--caption)' }}>
                <Building2 size={11} /> {industry}
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--caption)' }}>
                <Users size={11} /> {compSize}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ border: '1px solid var(--edge)', color: 'var(--body)', background: 'transparent' }}
            >
              <ClipboardList size={13} />
              Details
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button
              onClick={onReject}
              disabled={rejecting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{ border: '1px solid var(--edge)', color: 'var(--body)', background: 'transparent' }}
            >
              {rejecting ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
              Reject
            </button>
            <button
              onClick={onApprove}
              disabled={approving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-60"
              style={{ background: '#22c55e' }}
            >
              {approving ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
              Approve
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex flex-wrap gap-2 mt-3">
          {annualSpend !== '—' && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--app-bg)', border: '1px solid var(--edge)', color: 'var(--body)' }}
            >
              Spend: {annualSpend}
            </span>
          )}
          {ws.onboarding_data?.ordersPerMonth && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--app-bg)', border: '1px solid var(--edge)', color: 'var(--body)' }}
            >
              {ws.onboarding_data.ordersPerMonth} orders/mo
            </span>
          )}
          {(ws.onboarding_data?.categories || []).length > 0 && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--app-bg)', border: '1px solid var(--edge)', color: 'var(--body)' }}
            >
              {ws.onboarding_data.categories.length} procurement categor{ws.onboarding_data.categories.length === 1 ? 'y' : 'ies'}
            </span>
          )}
        </div>
      </div>

      {/* Expanded onboarding details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 sm:px-5 pb-5 pt-2"
              style={{ borderTop: '1px solid var(--edge)' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--caption)' }}>
                Full Onboarding Submission
              </p>
              <OnboardingDetailsPanel onboardingData={ws.onboarding_data} />

              {/* Repeat approve/reject inside expanded view */}
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  onClick={onReject}
                  disabled={rejecting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ border: '1px solid var(--edge)', color: 'var(--body)', background: 'transparent' }}
                >
                  {rejecting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Reject
                </button>
                <button
                  onClick={onApprove}
                  disabled={approving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{ background: '#22c55e' }}
                >
                  {approving ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                  Approve Workspace
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryCard({ ws }) {
  const [expanded, setExpanded] = useState(false);
  const owner = ws.profiles?.[0] || ws.profiles || null;
  const ownerEmail = owner?.email || '—';
  const resolvedAt = ws.updated_at
    ? format(new Date(ws.updated_at), 'dd MMM yyyy')
    : '—';

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--edge)', background: 'var(--surface)' }}
    >
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold" style={{ color: 'var(--heading)' }}>{ws.name}</span>
            <StatusBadge status={ws.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--caption)' }}>
              <Mail size={11} /> {ownerEmail}
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--caption)' }}>
              <Calendar size={11} /> {resolvedAt}
            </span>
            {ws.onboarding_data?.industry && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--caption)' }}>
                <Building2 size={11} /> {ws.onboarding_data.industry}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all"
          style={{ border: '1px solid var(--edge)', color: 'var(--body)', background: 'transparent' }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Hide' : 'View'} Details
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--edge)' }}>
              <OnboardingDetailsPanel onboardingData={ws.onboarding_data} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlatformJoinlistPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [pending, setPending] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId]  = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pendRes, resolvedRes] = await Promise.all([
        fetchPendingWorkspaces(),
        fetchResolvedJoinlistWorkspaces(),
      ]);
      setPending(Array.isArray(pendRes.data) ? pendRes.data : []);
      setResolved(Array.isArray(resolvedRes.data) ? resolvedRes.data : []);
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to load joinlist', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (wsId) => {
    setApprovingId(wsId);
    try {
      const { error } = await approveWorkspace(wsId, currentUser.id);
      if (error) throw error;
      toast({ title: 'Workspace approved', description: 'The workspace is now active and the owner has been notified.' });
      load();
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to approve', variant: 'destructive' });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (wsId) => {
    setRejectingId(wsId);
    try {
      const { error } = await rejectWorkspace(wsId, currentUser.id);
      if (error) throw error;
      toast({ title: 'Workspace rejected', description: 'The workspace has been archived.' });
      load();
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to reject', variant: 'destructive' });
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--heading)' }}>Join Requests</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--body)' }}>
          Review and approve new workspace applications from self-signup users.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND }} />
        </div>
      ) : (
        <>
          {/* Pending section */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--heading)' }}>
                Pending Approval
              </h2>
              {pending.length > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: `${BRAND}20`, color: BRAND }}
                >
                  {pending.length}
                </span>
              )}
            </div>

            {pending.length === 0 ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{ border: '1px dashed var(--edge)', background: 'var(--surface)' }}
              >
                <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: '#22c55e', opacity: 0.6 }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--body)' }}>No pending applications</p>
                <p className="text-xs mt-1" style={{ color: 'var(--caption)' }}>All workspace applications have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map(ws => (
                  <WorkspaceCard
                    key={ws.id}
                    ws={ws}
                    onApprove={() => handleApprove(ws.id)}
                    onReject={() => handleReject(ws.id)}
                    approving={approvingId === ws.id}
                    rejecting={rejectingId === ws.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* History section */}
          {resolved.length > 0 && (
            <section>
              <h2 className="text-base font-bold mb-4" style={{ color: 'var(--heading)' }}>
                History
              </h2>
              <div className="space-y-2">
                {resolved.map(ws => (
                  <HistoryCard key={ws.id} ws={ws} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
