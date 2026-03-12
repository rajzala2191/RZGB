import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, FileCheck, Zap, CheckCircle2, Hourglass,
  ShieldCheck, Truck, Clock, XCircle, Check, Cog,
  ChevronDown, ListChecks,
} from 'lucide-react';
import { ACCENT } from '@/lib/theme';

// ── Fixed stages — always shown ──────────────────────────────────────────────
const PRE_STAGES = [
  { id: 'PENDING_ADMIN_SCRUB', label: 'Order Received',   short: 'Received',  icon: Package     },
  { id: 'SANITIZED',           label: 'Under Review',      short: 'Review',    icon: FileCheck   },
  { id: 'AWARDED',             label: 'Supplier Assigned', short: 'Assigned',  icon: CheckCircle2},
];
const POST_STAGES = [
  { id: 'QC',        label: 'Quality Control', short: 'QC',       icon: ShieldCheck },
  { id: 'DISPATCH',  label: 'Dispatched',      short: 'Dispatch', icon: Truck       },
  { id: 'DELIVERED', label: 'Delivered',        short: 'Delivered',icon: CheckCircle2},
];

// Known manufacturing stage labels / icons — used as fallback for custom keys
const PROCESS_META = {
  MATERIAL: { label: 'Material Sourcing', short: 'Material', icon: Package   },
  CASTING:  { label: 'Casting',           short: 'Casting',  icon: Zap       },
  MACHINING:{ label: 'Machining',         short: 'Machining',icon: Hourglass },
};

function buildStages(selectedProcesses) {
  const midStages = (selectedProcesses && selectedProcesses.length > 0 ? selectedProcesses : ['MATERIAL', 'MACHINING'])
    .map(key => ({
      id:    key,
      label: PROCESS_META[key]?.label || key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' '),
      short: PROCESS_META[key]?.short || key.slice(0, 8),
      icon:  PROCESS_META[key]?.icon  || Cog,
    }));
  return [...PRE_STAGES, ...midStages, ...POST_STAGES];
}

// Kept for backwards-compatibility (compact usage without selectedProcesses)
const ALL_STAGES = buildStages(['MATERIAL', 'CASTING', 'MACHINING']);

/* ── Compact: segmented bar used in tables ──────────────────────────────────── */
function CompactTimeline({ currentIndex, stageCount }) {
  const count = stageCount || ALL_STAGES.length;
  return (
    <div className="flex items-center gap-0.5 w-full">
      {Array.from({ length: count }).map((_, i) => {
        const done    = i < currentIndex;
        const current = i === currentIndex;
        return (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-all duration-500"
            style={{
              background: done ? ACCENT : current ? `${ACCENT}80` : 'rgba(128,128,128,0.18)',
              transform: current ? 'scaleY(1.4)' : 'scaleY(1)',
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Full pipeline ──────────────────────────────────────────────────────────── */
export default function OrderTimeline({
  currentStatus = 'PENDING_ADMIN_SCRUB',
  createdAt,
  updatedAt,
  updates = [],
  compact = false,
  isWithdrawn = false,
  selectedProcesses,      // array of status_key strings — e.g. ['CASTING', 'MACHINING']
  editable = false,       // when true, sub-step checkboxes are interactive
  subStepsByKey = {},     // { [processKey]: subStep[] }
  progressBySubStepId = {},// { [subStepId]: { status, completed_at } }
  onUpdateProgress,       // (subStepId, newStatus) => void
}) {
  const scrollRef = useRef(null);
  const [expandedStages, setExpandedStages] = useState(new Set());

  const toggleStageExpand = (stageId) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      next.has(stageId) ? next.delete(stageId) : next.add(stageId);
      return next;
    });
  };
  const stages = buildStages(selectedProcesses);

  const t = {
    card:           'var(--surface)',
    cardBorder:     'var(--edge-subtle)',
    activeBg:       'rgba(255,107,53,0.07)',
    activeBorder:   'rgba(255,107,53,0.2)',
    doneBg:         'var(--surface-inset)',
    futureBg:       'transparent',
    text:           'var(--heading)',
    textMuted:      'var(--body)',
    textFaint:      'var(--faint)',
    dot:            'var(--edge)',
    dotBorder:      'var(--edge-strong)',
    connectorDone:  ACCENT,
    connectorFuture:'var(--edge)',
    noteBg:         'var(--surface-inset)',
    noteBorder:     'var(--edge-subtle)',
  };

  /* withdrawn state */
  if (isWithdrawn || currentStatus === 'WITHDRAWN') {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-2xl"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <XCircle size={18} style={{ color: '#ef4444' }} />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: '#ef4444' }}>Order Withdrawn</p>
          {updatedAt && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(239,68,68,0.6)' }}>
              {new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentIndex = stages.findIndex(s => s.id === currentStatus);

  if (compact) return <CompactTimeline currentIndex={currentIndex} stageCount={stages.length} />;

  /* build update map */
  const updatesByStage = {};
  updates.forEach(u => {
    if (!updatesByStage[u.stage]) updatesByStage[u.stage] = [];
    updatesByStage[u.stage].push(u);
  });

  const pct = currentIndex < 0 ? 0 : Math.round(((currentIndex + 1) / stages.length) * 100);

  /* scroll active node into view */
  useEffect(() => {
    if (!scrollRef.current) return;
    const active = scrollRef.current.querySelector('[data-active="true"]');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentStatus]);

  return (
    <div className="space-y-6">

      {/* ── Progress header ────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: ACCENT }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: ACCENT }} />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>
            {currentIndex >= 0 ? stages[currentIndex].label : 'Processing'}
          </span>
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color: ACCENT }}>{pct}%</span>
      </div>

      {/* ── Master progress bar ────────────────────────────── */}
      <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'var(--edge)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${ACCENT}, #f97316)` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>

      {/* ── Horizontal stage nodes (scrollable) ────────────── */}
      <div ref={scrollRef} className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex items-start gap-0 min-w-max">
          {stages.map((stage, i) => {
            const done    = i < currentIndex;
            const current = i === currentIndex;
            const Icon    = stage.icon;

            return (
              <div key={stage.id} className="flex items-center" data-active={current}>
                {/* Node */}
                <div className="flex flex-col items-center gap-2 w-16">
                  <motion.div
                    initial={false}
                    animate={current ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={current ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                    className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: done ? `${ACCENT}20` : current ? ACCENT : t.dot,
                      border: `1.5px solid ${done ? `${ACCENT}50` : current ? ACCENT : t.dotBorder}`,
                      boxShadow: current ? `0 0 16px ${ACCENT}40` : 'none',
                    }}
                  >
                    {done ? (
                      <Check size={14} style={{ color: ACCENT }} strokeWidth={2.5} />
                    ) : (
                      <Icon size={14} style={{ color: current ? '#fff' : t.textFaint }} />
                    )}
                    {current && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 animate-pulse"
                        style={{ background: ACCENT, borderColor: 'var(--app-bg)' }} />
                    )}
                  </motion.div>
                  <p
                    className="text-[10px] font-semibold text-center leading-tight"
                    style={{ color: done ? t.textMuted : current ? t.text : t.textFaint }}
                  >
                    {stage.short}
                  </p>
                </div>

                {/* Connector */}
                {i < stages.length - 1 && (
                  <div className="w-6 shrink-0 mb-5">
                    <div className="h-px" style={{ background: done ? `${ACCENT}60` : t.connectorFuture }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Stage detail rows ──────────────────────────────── */}
      <div className="space-y-2">
        {stages.map((stage, i) => {
          const done    = i < currentIndex;
          const current = i === currentIndex;
          const future  = i > currentIndex;
          const Icon    = stage.icon;
          const stageUpdates = updatesByStage[stage.id] || [];

          let timestamp = null;
          if (i === 0 && createdAt)                                     timestamp = createdAt;
          else if (current && updatedAt)                                 timestamp = updatedAt;
          else if (done && stageUpdates.length > 0)                     timestamp = stageUpdates[stageUpdates.length - 1].created_at;

          if (future) return (
            <div
              key={stage.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ opacity: 0.4 }}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.dot, border: `1px solid ${t.dotBorder}` }}>
                <Icon size={11} style={{ color: t.textFaint }} />
              </div>
              <span className="text-xs font-medium" style={{ color: t.textFaint }}>{stage.label}</span>
            </div>
          );

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="rounded-xl overflow-hidden"
              style={{
                background:  current ? t.activeBg  : t.doneBg,
                border:      `1px solid ${current ? t.activeBorder : 'transparent'}`,
              }}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                {/* Icon */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: current ? `${ACCENT}20` : 'rgba(34,197,94,0.12)',
                    border: `1px solid ${current ? `${ACCENT}30` : 'rgba(34,197,94,0.2)'}`,
                  }}
                >
                  {done
                    ? <Check size={13} style={{ color: '#22c55e' }} strokeWidth={2.5} />
                    : <Icon size={13} style={{ color: ACCENT }} />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: current ? t.text : t.textMuted }}>
                        {stage.label}
                      </span>
                      {current && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${ACCENT}20`, color: ACCENT }}
                        >
                          In Progress
                        </span>
                      )}
                      {done && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
                        >
                          Complete
                        </span>
                      )}
                    </div>
                    {timestamp && (
                      <span className="text-[11px] font-mono shrink-0" style={{ color: t.textFaint }}>
                        {new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Update notes */}
                  <AnimatePresence>
                    {stageUpdates.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-1.5"
                      >
                        {stageUpdates.slice(-3).map((u, j) => (
                          <div
                            key={j}
                            className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                            style={{ background: t.noteBg, border: `1px solid ${t.noteBorder}` }}
                          >
                            <Clock size={11} style={{ color: t.textFaint, marginTop: 1, flexShrink: 0 }} />
                            <span className="font-mono shrink-0" style={{ color: t.textFaint }}>
                              {new Date(u.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span style={{ color: t.textMuted }}>{u.notes}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sub-step checklist toggle */}
                  {subStepsByKey[stage.id]?.length > 0 && (() => {
                    const steps = subStepsByKey[stage.id];
                    const completedCount = steps.filter(s => progressBySubStepId[s.id]?.status === 'completed').length;
                    const isExpanded = expandedStages.has(stage.id);
                    return (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleStageExpand(stage.id)}
                          className="flex items-center gap-2 text-xs font-semibold py-1"
                          style={{ color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <ListChecks size={12} style={{ color: ACCENT }} />
                          <span>{completedCount}/{steps.length} sub-steps</span>
                          <div style={{ width: 48, height: 3, borderRadius: 999, background: 'var(--edge)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(completedCount / steps.length) * 100}%`, background: ACCENT, borderRadius: 999 }} />
                          </div>
                          <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
                            <ChevronDown size={12} style={{ color: t.textFaint }} />
                          </motion.span>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-2 space-y-1.5 overflow-hidden"
                            >
                              {steps.map(step => {
                                const prog = progressBySubStepId[step.id];
                                const isComplete = prog?.status === 'completed';
                                return (
                                  <div
                                    key={step.id}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs"
                                    style={{ background: t.noteBg, border: `1px solid ${t.noteBorder}`, opacity: isComplete ? 0.85 : 1 }}
                                  >
                                    {editable ? (
                                      <button
                                        onClick={() => onUpdateProgress?.(step.id, isComplete ? 'pending' : 'completed')}
                                        style={{
                                          width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${isComplete ? ACCENT : 'var(--edge-strong)'}`,
                                          background: isComplete ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        }}
                                      >
                                        {isComplete && <Check size={10} style={{ color: '#fff' }} strokeWidth={3} />}
                                      </button>
                                    ) : (
                                      <div
                                        style={{
                                          width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${isComplete ? ACCENT : 'var(--edge-strong)'}`,
                                          background: isComplete ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                      >
                                        {isComplete && <Check size={10} style={{ color: '#fff' }} strokeWidth={3} />}
                                      </div>
                                    )}
                                    <span style={{ flex: 1, color: isComplete ? t.textMuted : t.text, textDecoration: isComplete ? 'line-through' : 'none' }}>
                                      {step.name}
                                    </span>
                                    {step.is_required && !isComplete && (
                                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999, background: 'rgba(255,107,53,0.1)', color: ACCENT, border: '1px solid rgba(255,107,53,0.2)' }}>Required</span>
                                    )}
                                    {isComplete && prog?.completed_at && (
                                      <span className="font-mono" style={{ color: t.textFaint, fontSize: 10 }}>
                                        {new Date(prog.completed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export { ALL_STAGES, buildStages };
