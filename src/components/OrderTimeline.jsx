import React from 'react';
import {
  Package, FileCheck, Zap, CheckCircle2, Hourglass,
  ShieldCheck, Truck, Clock, XCircle
} from 'lucide-react';

const ALL_STAGES = [
  { id: 'PENDING_ADMIN_SCRUB', label: 'Order Submitted', icon: Package, color: 'blue' },
  { id: 'SANITIZED', label: 'Under Review', icon: FileCheck, color: 'purple' },
  { id: 'AWARDED', label: 'Supplier Assigned', icon: CheckCircle2, color: 'amber' },
  { id: 'MATERIAL', label: 'Material Sourcing', icon: Package, color: 'sky' },
  { id: 'CASTING', label: 'Casting', icon: Zap, color: 'orange' },
  { id: 'MACHINING', label: 'Machining', icon: Hourglass, color: 'violet' },
  { id: 'QC', label: 'Quality Control', icon: ShieldCheck, color: 'emerald' },
  { id: 'DISPATCH', label: 'Dispatched', icon: Truck, color: 'blue' },
  { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2, color: 'green' },
];

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-500',    ring: 'ring-blue-500/30',    text: 'text-blue-400',    line: 'bg-blue-500' },
  purple:  { bg: 'bg-purple-500',  ring: 'ring-purple-500/30',  text: 'text-purple-400',  line: 'bg-purple-500' },
  indigo:  { bg: 'bg-indigo-500',  ring: 'ring-indigo-500/30',  text: 'text-indigo-400',  line: 'bg-indigo-500' },
  cyan:    { bg: 'bg-cyan-500',    ring: 'ring-cyan-500/30',    text: 'text-cyan-400',    line: 'bg-cyan-500' },
  amber:   { bg: 'bg-amber-500',   ring: 'ring-amber-500/30',   text: 'text-amber-400',   line: 'bg-amber-500' },
  sky:     { bg: 'bg-sky-500',     ring: 'ring-sky-500/30',     text: 'text-sky-400',     line: 'bg-sky-500' },
  orange:  { bg: 'bg-orange-500',  ring: 'ring-orange-500/30',  text: 'text-orange-400',  line: 'bg-orange-500' },
  violet:  { bg: 'bg-violet-500',  ring: 'ring-violet-500/30',  text: 'text-violet-400',  line: 'bg-violet-500' },
  emerald: { bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-400', line: 'bg-emerald-500' },
  green:   { bg: 'bg-green-500',   ring: 'ring-green-500/30',   text: 'text-green-400',   line: 'bg-green-500' },
};

/**
 * OrderTimeline — universal timeline for all roles.
 * 
 * @param {string} currentStatus  - The order_status from the DB
 * @param {string} createdAt      - ISO date of when order was created
 * @param {string} updatedAt      - ISO date of last update
 * @param {Array}  updates        - Array of job_updates objects (optional)
 * @param {boolean} compact       - If true, renders a single-line mini version
 * @param {boolean} isWithdrawn   - If true, shows withdrawn state
 */
export default function OrderTimeline({ 
  currentStatus = 'PENDING_ADMIN_SCRUB', 
  createdAt, 
  updatedAt, 
  updates = [], 
  compact = false,
  isWithdrawn = false
}) {
  if (isWithdrawn || currentStatus === 'WITHDRAWN') {
    return (
      <div className="flex items-center gap-3 py-3 px-4 bg-red-950/30 border border-red-800/50 rounded-lg">
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div>
          <p className="text-red-400 font-semibold text-sm">Order Withdrawn</p>
          {updatedAt && <p className="text-red-400/60 text-xs">on {new Date(updatedAt).toLocaleDateString()}</p>}
        </div>
      </div>
    );
  }

  const currentIndex = ALL_STAGES.findIndex(s => s.id === currentStatus);

  // Compact single-line version for tables/cards
  if (compact) {
    return (
      <div className="flex items-center gap-1 w-full">
        {ALL_STAGES.map((stage, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          const colors = COLOR_MAP[stage.color];
          return (
            <div key={stage.id} className="flex items-center flex-1 min-w-0">
              <div 
                className={`h-2 flex-1 rounded-full transition-all ${
                  isPast ? colors.bg : isCurrent ? `${colors.bg} animate-pulse` : 'bg-slate-700'
                }`}
                title={stage.label}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Build update timestamps keyed by stage
  const updatesByStage = {};
  updates.forEach(u => {
    if (!updatesByStage[u.stage]) updatesByStage[u.stage] = [];
    updatesByStage[u.stage].push(u);
  });

  return (
    <div className="relative">
      {ALL_STAGES.map((stage, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;
        const colors = COLOR_MAP[stage.color];
        const Icon = stage.icon;
        const stageUpdates = updatesByStage[stage.id] || [];

        // Determine timestamp
        let timestamp = null;
        if (isCurrent && updatedAt) timestamp = updatedAt;
        else if (isPast && stageUpdates.length > 0) timestamp = stageUpdates[stageUpdates.length - 1].created_at;
        else if (i === 0 && createdAt) timestamp = createdAt;

        return (
          <div key={stage.id} className="relative flex gap-4">
            {/* Vertical line connector */}
            {i < ALL_STAGES.length - 1 && (
              <div className="absolute left-[19px] top-10 w-0.5 h-[calc(100%-16px)]">
                <div className={`h-full rounded-full transition-all ${isPast ? colors.line : 'bg-slate-700/50'}`} />
              </div>
            )}

            {/* Circle icon */}
            <div className="flex-shrink-0 z-10">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isPast 
                    ? `${colors.bg} text-white shadow-lg`
                    : isCurrent 
                      ? `${colors.bg} text-white ring-4 ${colors.ring} shadow-lg animate-pulse`
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <Icon className="w-5 h-5" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className={`flex-1 pb-8 ${i === ALL_STAGES.length - 1 ? 'pb-0' : ''}`}>
              <div className={`rounded-lg p-3 transition-all ${
                isCurrent 
                  ? 'bg-slate-800/80 border border-slate-700' 
                  : isPast 
                    ? 'bg-transparent' 
                    : 'bg-transparent opacity-50'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className={`font-semibold text-sm ${
                    isCurrent ? colors.text : isPast ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {stage.label}
                    {isCurrent && (
                      <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colors.bg} text-white`}>
                        <Clock className="w-3 h-3" /> Current
                      </span>
                    )}
                  </h4>
                  {timestamp && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Stage updates / notes */}
                {stageUpdates.length > 0 && (isPast || isCurrent) && (
                  <div className="mt-2 space-y-1">
                    {stageUpdates.slice(-2).map((u, j) => (
                      <div key={j} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-slate-600 font-mono whitespace-nowrap">
                          {new Date(u.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>{u.notes}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { ALL_STAGES };
