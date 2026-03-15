import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Zap } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

const BRAND = '#FF6B35';

function UsageBar({ label, used, max, pct, warn }) {
  const barColor = warn ? '#ef4444' : BRAND;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs" style={{ color: 'var(--body)' }}>{label}</span>
        <span className="text-xs font-bold" style={{ color: warn ? '#ef4444' : 'var(--heading)' }}>
          {used} / {max === Infinity ? '∞' : max}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-raised)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: barColor }}
        />
      </div>
    </div>
  );
}

export default function PlanUsageBanner() {
  const { plan, monthlyOrders, userCount, limits, loading } = useSubscription();

  if (loading || plan !== 'free') return null;

  const orderPct = Math.min((monthlyOrders / limits.maxOrdersPerMonth) * 100, 100);
  const userPct  = Math.min((userCount  / limits.maxUsers)             * 100, 100);
  const nearOrderLimit = orderPct >= 80;
  const nearUserLimit  = userPct  >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl p-4 mb-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--edge)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,107,53,0.1)' }}>
            <Zap size={12} style={{ color: BRAND }} />
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--heading)' }}>
            Free Plan Usage
          </span>
        </div>
        <Link
          to="/pricing"
          className="flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-70"
          style={{ color: BRAND }}
        >
          Upgrade <ArrowUpRight size={11} />
        </Link>
      </div>

      {/* Usage bars */}
      <div className="grid grid-cols-2 gap-4">
        <UsageBar
          label="Orders this month"
          used={monthlyOrders}
          max={limits.maxOrdersPerMonth}
          pct={orderPct}
          warn={nearOrderLimit}
        />
        <UsageBar
          label="Team members"
          used={userCount}
          max={limits.maxUsers}
          pct={userPct}
          warn={nearUserLimit}
        />
      </div>
    </motion.div>
  );
}
