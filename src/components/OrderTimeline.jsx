import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Package, FileCheck, Zap, CheckCircle2, Hourglass,
  ShieldCheck, Truck, Clock, XCircle, Check,
} from 'lucide-react';

const ALL_STAGES = [
  { id: 'PENDING_ADMIN_SCRUB', label: 'Order Received',    short: 'Received',    icon: Package     },
  { id: 'SANITIZED',           label: 'Under Review',       short: 'Review',      icon: FileCheck   },
  { id: 'AWARDED',             label: 'Supplier Assigned',  short: 'Assigned',    icon: CheckCircle2},
  { id: 'MATERIAL',            label: 'Material Sourcing',  short: 'Material',    icon: Package     },
  { id: 'CASTING',             label: 'Casting',            short: 'Casting',     icon: Zap         },
  { id: 'MACHINING',           label: 'Machining',          short: 'Machining',   icon: Hourglass   },
  { id: 'QC',                  label: 'Quality Control',    short: 'QC',          icon: ShieldCheck },
  { id: 'DISPATCH',            label: 'Dispatched',         short: 'Dispatch',    icon: Truck       },
  { id: 'DELIVERED',           label: 'Delivered',          short: 'Delivered',   icon: CheckCircle2},
];

const ACCENT = '#FF6B35';

/* ── Compact: segmented bar used in tables ──────────────────── */
function CompactTimeline({ currentIndex }) {
  return (
    <div className="flex items-center gap-0.5 w-full">
      {ALL_STAGES.map((_, i) => {
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

/* ── Full pipeline ──────────────────────────────────────────── */
export default function OrderTimeline({
  currentStatus = 'PENDING_ADMIN_SCRUB',
  createdAt,
  updatedAt,
  updates = [],
  compact = false,
  isWithdrawn = false,
}) {
  const { isDark } = useTheme();
  const scrollRef = useRef(null);

  const t = isDark ? {
    card:        'rgba(255,255,255,0.04)',
    cardBorder:  'rgba(255,255,255,0.08)',
    activeBg:    'rgba(255,107,53,0.1)',
    activeBorder:'rgba(255,107,53,0.25)',
    doneBg:      'rgba(255,255,255,0.03)',
    futureBg:    'transparent',
    text:        '#ffffff',
    textMuted:   'rgba(255,255,255,0.5)',
    textFaint:   'rgba(255,255,255,0.25)',
    dot:         'rgba(255,255,255,0.1)',
    dotBorder:   'rgba(255,255,255,0.12)',
    connectorDone:  ACCENT,
    connectorFuture:'rgba(255,255,255,0.1)',
    noteBg:      'rgba(255,255,255,0.04)',
    noteBorder:  'rgba(255,255,255,0.07)',
  } : {
    card:        '#ffffff',
    cardBorder:  'rgba(0,0,0,0.08)',
    activeBg:    'rgba(255,107,53,0.07)',
    activeBorder:'rgba(255,107,53,0.2)',
    doneBg:      'rgba(0,0,0,0.02)',
    futureBg:    'transparent',
    text:        '#0f0f0f',
    textMuted:   'rgba(0,0,0,0.5)',
    textFaint:   'rgba(0,0,0,0.28)',
    dot:         'rgba(0,0,0,0.07)',
    dotBorder:   'rgba(0,0,0,0.1)',
    connectorDone:  ACCENT,
    connectorFuture:'rgba(0,0,0,0.1)',
    noteBg:      'rgba(0,0,0,0.03)',
    noteBorder:  'rgba(0,0,0,0.07)',
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

  const currentIndex = ALL_STAGES.findIndex(s => s.id === currentStatus);

  if (compact) return <CompactTimeline currentIndex={currentIndex} />;

  /* build update map */
  const updatesByStage = {};
  updates.forEach(u => {
    if (!updatesByStage[u.stage]) updatesByStage[u.stage] = [];
    updatesByStage[u.stage].push(u);
  });

  const pct = currentIndex < 0 ? 0 : Math.round(((currentIndex + 1) / ALL_STAGES.length) * 100);

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
            {currentIndex >= 0 ? ALL_STAGES[currentIndex].label : 'Processing'}
          </span>
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color: ACCENT }}>{pct}%</span>
      </div>

      {/* ── Master progress bar ────────────────────────────── */}
      <div className="relative h-1 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
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
          {ALL_STAGES.map((stage, i) => {
            const done    = i < currentIndex;
            const current = i === currentIndex;
            const future  = i > currentIndex;
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
                        style={{ background: ACCENT, borderColor: isDark ? '#09090b' : '#f0f0f2' }} />
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
                {i < ALL_STAGES.length - 1 && (
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
        {ALL_STAGES.map((stage, i) => {
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
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export { ALL_STAGES };
