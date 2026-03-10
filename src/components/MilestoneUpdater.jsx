import { useState, useEffect } from 'react';
import { Check, ChevronRight, Loader2, Lock, CheckCircle2, Circle } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

/* ── Stage definitions ───────────────────────────────────────── */
const STAGES = [
  {
    id: 'AWARDED',   label: 'Awarded',   color: '#f59e0b',
    next: 'MATERIAL', nextLabel: 'Material',
    checklist: [
      'Review order specifications and drawings',
      'Confirm material availability',
      'Acknowledge delivery timeline',
      'Accept job formally',
    ],
  },
  {
    id: 'MATERIAL',  label: 'Material',  color: '#0ea5e9',
    next: 'CASTING', nextLabel: 'Casting',
    checklist: [
      'Material sourced from approved supplier',
      'Material grade / certification verified',
      'Material quantity checked against order',
      'Material delivered to production site',
    ],
  },
  {
    id: 'CASTING',   label: 'Casting',   color: '#f97316',
    next: 'MACHINING', nextLabel: 'Machining',
    checklist: [
      'Mould / pattern prepared and inspected',
      'Casting process completed',
      'Visual inspection passed',
      'Casting dimensions within tolerance',
    ],
  },
  {
    id: 'MACHINING', label: 'Machining', color: '#8b5cf6',
    next: 'QC', nextLabel: 'QC',
    checklist: [
      'Machine setup and tooling confirmed',
      'Roughing operations complete',
      'Finishing operations complete',
      'All dimensions verified against drawing',
    ],
  },
  {
    id: 'QC',        label: 'QC',        color: '#22c55e',
    next: 'DISPATCH', nextLabel: 'Dispatch',
    checklist: [
      'Dimensional inspection report completed',
      'Surface finish and cosmetic check passed',
      'Material certification attached',
      'QC sign-off obtained',
    ],
  },
  {
    id: 'DISPATCH',  label: 'Dispatch',  color: '#06b6d4',
    next: 'DELIVERED', nextLabel: 'Delivered',
    checklist: [
      'Parts cleaned and packaged securely',
      'Shipping label generated and attached',
      'Carrier / courier booked',
      'Tracking number recorded',
    ],
  },
];

const textPrimary = '#0a0a0a';
const textMuted   = '#737373';
const inner       = '#f4f4f5';

export default function MilestoneUpdater({ orderId, rzJobId, currentStatus, onUpdate }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const stage    = STAGES.find(s => s.id === currentStatus) || null;
  const stageIdx = STAGES.findIndex(s => s.id === currentStatus);

  const [checked,   setChecked]   = useState([]);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    if (stage) setChecked(new Array(stage.checklist.length).fill(false));
  }, [currentStatus]);

  const toggle = (i) => {
    setChecked(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const isDone       = currentStatus === 'DELIVERED' || currentStatus === 'COMPLETED';
  const checklist    = stage?.checklist || [];
  const doneCount    = checked.filter(Boolean).length;
  const allChecked   = checklist.length > 0 && doneCount === checklist.length;
  const pct          = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;

  const handleAdvance = async () => {
    if (!stage?.next || !allChecked || advancing) return;
    setAdvancing(true);
    try {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ order_status: stage.next, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;

      if (rzJobId) {
        await supabaseAdmin.from('job_updates').insert({
          rz_job_id:  rzJobId,
          stage:      stage.next,
          notes:      `Checklist completed — advanced from ${stage.label} to ${stage.nextLabel}`,
          updated_by: currentUser?.id,
        });
      }

      toast({
        title: 'Stage Advanced',
        description: `Order moved to ${stage.nextLabel}.`,
        className: 'bg-emerald-600 border-emerald-700 text-white',
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      toast({ title: 'Update Failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setAdvancing(false);
    }
  };

  /* ── Completed ── */
  if (isDone) return (
    <div className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
      style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
      <CheckCircle2 size={36} style={{ color: '#22c55e' }} />
      <p className="text-sm font-bold" style={{ color: '#22c55e' }}>All stages complete</p>
      <p className="text-xs" style={{ color: textMuted }}>This job has been fully delivered.</p>
    </div>
  );

  /* ── No matching stage ── */
  if (!stage) return (
    <div className="rounded-xl p-5 text-center" style={{ background: inner }}>
      <p className="text-sm" style={{ color: textMuted }}>
        No active checklist for status: <span className="font-mono font-bold">{currentStatus}</span>
      </p>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span
            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: `${stage.color}18`, color: stage.color }}
          >
            {stage.label} stage
          </span>
          <p className="text-sm font-bold pt-1" style={{ color: textPrimary }}>
            Complete checklist to advance to{' '}
            <span style={{ color: stage.color }}>{stage.nextLabel}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tabular-nums"
            style={{ color: allChecked ? '#22c55e' : textPrimary }}>
            {doneCount}/{checklist.length}
          </p>
          <p className="text-[11px]" style={{ color: textMuted }}>items done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: inner }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: allChecked ? '#22c55e' : stage.color }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {checklist.map((item, i) => {
          const done = checked[i] === true;
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors duration-150 cursor-pointer"
              style={{
                background: done ? 'rgba(34,197,94,0.06)' : inner,
                border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : '#e5e5e5'}`,
              }}
            >
              {/* Custom checkbox */}
              <div
                className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
                style={{
                  background:  done ? '#22c55e' : 'transparent',
                  border: `2px solid ${done ? '#22c55e' : '#d4d4d8'}`,
                }}
              >
                {done && <Check size={11} strokeWidth={3} color="#fff" />}
              </div>

              {/* Text */}
              <span
                className="flex-1 text-sm font-medium"
                style={{
                  color: done ? '#16a34a' : textPrimary,
                  textDecoration: done ? 'line-through' : 'none',
                  opacity: done ? 0.65 : 1,
                }}
              >
                {item}
              </span>

              <span className="text-[10px] font-bold flex-shrink-0" style={{ color: textMuted }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Advance footer */}
      <div
        className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300"
        style={{
          background: allChecked ? `${stage.color}0d` : inner,
          border: `1px solid ${allChecked ? `${stage.color}35` : '#e5e5e5'}`,
        }}
      >
        <div className="flex items-start gap-3">
          {allChecked
            ? <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
            : <Lock size={18} style={{ color: textMuted, flexShrink: 0, marginTop: 1 }} />}
          <div>
            <p className="text-sm font-bold" style={{ color: allChecked ? textPrimary : textMuted }}>
              {allChecked ? 'All items complete — ready to advance' : `Complete all ${checklist.length} items to unlock`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
              {allChecked
                ? `This will move the order to the ${stage.nextLabel} stage.`
                : `${checklist.length - doneCount} item${checklist.length - doneCount !== 1 ? 's' : ''} remaining`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdvance}
          disabled={!allChecked || advancing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          style={{ background: allChecked ? stage.color : '#d4d4d8' }}
        >
          {advancing ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
          {advancing ? 'Advancing…' : `Advance to ${stage.nextLabel}`}
        </button>
      </div>

      {/* Mini stage tracker */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        {STAGES.map((s, i) => {
          const past    = i < stageIdx;
          const current = i === stageIdx;
          return (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{
                  background: current ? `${s.color}15` : past ? 'rgba(34,197,94,0.08)' : 'transparent',
                  border: `1px solid ${current ? `${s.color}40` : past ? 'rgba(34,197,94,0.2)' : 'transparent'}`,
                }}
              >
                {past
                  ? <Check size={10} style={{ color: '#22c55e' }} />
                  : <Circle size={7} fill={current ? s.color : '#d4d4d8'} stroke="none" />}
                <span className="text-[10px] font-semibold"
                  style={{ color: current ? s.color : past ? '#22c55e' : textMuted }}>
                  {s.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className="w-3 h-px flex-shrink-0"
                  style={{ background: past ? 'rgba(34,197,94,0.35)' : '#e4e4e7' }} />
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
