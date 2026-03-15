import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ArrowRight, Lock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PLAN_LABELS, PLAN_ORDER, getPlanLimits } from '@/lib/planLimits';
import { ACCENT } from '@/lib/theme';

const BRAND = ACCENT || '#FF6B35';

const LIMIT_MESSAGES = {
  orders: (plan, limits) =>
    `You've reached the ${limits.maxOrdersPerMonth} orders/month limit on the ${PLAN_LABELS[plan]} plan.`,
  users: (plan, limits) =>
    `You've reached the ${limits.maxUsers} user limit on the ${PLAN_LABELS[plan]} plan.`,
  feature: (plan, featureName) =>
    `${featureName ?? 'This feature'} is not available on the ${PLAN_LABELS[plan]} plan.`,
};

/**
 * Modal shown when a user hits a plan limit or tries to use a gated feature.
 *
 * Props:
 *  open        — boolean
 *  onClose     — () => void
 *  limitType   — 'orders' | 'users' | 'feature'
 *  featureName — string (shown for limitType='feature')
 */
export default function UpgradeModal({ open, onClose, limitType = 'orders', featureName }) {
  const navigate = useNavigate();
  const { plan, limits } = useSubscription();

  const currentIdx = PLAN_ORDER.indexOf(plan);
  const suggestedPlanId = PLAN_ORDER[currentIdx + 1] ?? 'enterprise';
  const suggestedPlan = getPlanLimits(suggestedPlanId);

  const getMessage = () => {
    if (limitType === 'feature') return LIMIT_MESSAGES.feature(plan, featureName);
    if (limitType === 'users') return LIMIT_MESSAGES.users(plan, limits);
    return LIMIT_MESSAGES.orders(plan, limits);
  };

  const handleUpgrade = () => {
    onClose?.();
    navigate('/pricing');
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden z-10"
            style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div className="h-1" style={{ background: `linear-gradient(to right, ${BRAND}, #fb923c, #8b5cf6)` }} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:opacity-70"
              style={{ color: 'var(--caption)' }}
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8">
              {/* Icon + heading */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${BRAND}15`, border: `1px solid ${BRAND}25` }}
                >
                  <Lock size={22} style={{ color: BRAND }} />
                </div>
                <div>
                  <h2 className="text-xl font-black" style={{ color: 'var(--heading)' }}>
                    Upgrade your plan
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--body)' }}>
                    {getMessage()}
                  </p>
                </div>
              </div>

              {/* Suggested upgrade */}
              {suggestedPlanId !== 'enterprise' ? (
                <div
                  className="rounded-xl p-4 mb-5"
                  style={{ background: `${BRAND}08`, border: `1px solid ${BRAND}20` }}
                >
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND }}>
                    Recommended upgrade
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold" style={{ color: 'var(--heading)' }}>
                        {suggestedPlan.name} Plan
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {suggestedPlan.maxUsers !== Infinity && (
                          <li className="text-xs flex items-center gap-1.5" style={{ color: 'var(--body)' }}>
                            <TrendingUp size={11} style={{ color: BRAND }} />
                            Up to {suggestedPlan.maxUsers} users
                          </li>
                        )}
                        {suggestedPlan.maxOrdersPerMonth !== Infinity ? (
                          <li className="text-xs flex items-center gap-1.5" style={{ color: 'var(--body)' }}>
                            <TrendingUp size={11} style={{ color: BRAND }} />
                            {suggestedPlan.maxOrdersPerMonth} orders/month
                          </li>
                        ) : (
                          <li className="text-xs flex items-center gap-1.5" style={{ color: 'var(--body)' }}>
                            <TrendingUp size={11} style={{ color: BRAND }} />
                            Unlimited orders
                          </li>
                        )}
                      </ul>
                    </div>
                    <Zap size={24} style={{ color: BRAND, opacity: 0.6 }} />
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-xl p-4 mb-5"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#8b5cf6' }}>
                    Enterprise
                  </p>
                  <p className="text-sm" style={{ color: 'var(--body)' }}>
                    Unlimited users, unlimited orders, dedicated support.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleUpgrade}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}35` }}
                >
                  View plans <ArrowRight size={14} />
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: 'var(--surface-raised)',
                    color: 'var(--heading)',
                    border: '1px solid var(--edge)',
                  }}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
