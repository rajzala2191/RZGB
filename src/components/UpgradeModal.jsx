import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ArrowRight, Lock, TrendingUp, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { createCheckoutSession } from '@/services/subscriptionService';
import { PLAN_LABELS, PLAN_ORDER, getPlanLimits } from '@/lib/planLimits';
import { ACCENT } from '@/lib/theme';
import { useToast } from '@/components/ui/use-toast';

const BRAND = ACCENT || '#FF6B35';

const PLAN_PRICES = {
  starter: { monthly: 299,  annual: Math.round(299  * 0.8) },
  growth:  { monthly: 1499, annual: Math.round(1499 * 0.8) },
};

const LIMIT_MESSAGES = {
  orders:  (plan, limits) => `You've reached the ${limits.maxOrdersPerMonth} orders/month limit on the ${PLAN_LABELS[plan]} plan.`,
  users:   (plan, limits) => `You've reached the ${limits.maxUsers} user limit on the ${PLAN_LABELS[plan]} plan.`,
  feature: (plan, _, featureName) => `${featureName ?? 'This feature'} is not available on the ${PLAN_LABELS[plan]} plan.`,
};

/**
 * Modal shown when a user hits a plan limit or tries to use a gated feature.
 * Drives directly to Stripe Checkout for paid plans.
 *
 * Props:
 *  open        — boolean
 *  onClose     — () => void
 *  limitType   — 'orders' | 'users' | 'feature'
 *  featureName — string (shown for limitType='feature')
 */
export default function UpgradeModal({ open, onClose, limitType = 'orders', featureName }) {
  const navigate = useNavigate();
  const { workspaceId } = useAuth();
  const { plan, limits } = useSubscription();
  const { toast } = useToast();

  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null); // plan id being checked out

  const currentIdx = PLAN_ORDER.indexOf(plan);
  // Suggest the next paid tier, skip 'enterprise' (contact sales)
  const suggestedPlanIds = PLAN_ORDER.slice(currentIdx + 1).filter(p => p !== 'enterprise');

  const getMessage = () => {
    if (limitType === 'feature') return LIMIT_MESSAGES.feature(plan, limits, featureName);
    if (limitType === 'users') return LIMIT_MESSAGES.users(plan, limits);
    return LIMIT_MESSAGES.orders(plan, limits);
  };

  const handleCheckout = async (targetPlan) => {
    if (!workspaceId) {
      toast({ title: 'Error', description: 'No workspace found.', variant: 'destructive' });
      return;
    }
    setLoadingPlan(targetPlan);
    try {
      const { url, error } = await createCheckoutSession({ workspaceId, plan: targetPlan, annual });
      if (error) throw error;
      if (url) window.location.href = url;
    } catch (err) {
      toast({ title: 'Checkout failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
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
            className="relative w-full max-w-lg rounded-2xl overflow-hidden z-10"
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
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${BRAND}15`, border: `1px solid ${BRAND}25` }}
                >
                  <Lock size={20} style={{ color: BRAND }} />
                </div>
                <div>
                  <h2 className="text-xl font-black" style={{ color: 'var(--heading)' }}>Upgrade your plan</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--body)' }}>{getMessage()}</p>
                </div>
              </div>

              {/* Annual toggle */}
              {suggestedPlanIds.length > 0 && (
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="text-xs font-semibold" style={{ color: !annual ? 'var(--heading)' : 'var(--caption)' }}>Monthly</span>
                  <button
                    onClick={() => setAnnual(!annual)}
                    className="w-10 h-5 rounded-full relative transition-all flex-shrink-0"
                    style={{ background: annual ? BRAND : 'var(--edge-strong)' }}
                  >
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: annual ? 22 : 2 }} />
                  </button>
                  <span className="text-xs font-semibold" style={{ color: annual ? 'var(--heading)' : 'var(--caption)' }}>
                    Annual <span className="text-emerald-500 font-bold">Save 20%</span>
                  </span>
                </div>
              )}

              {/* Plan cards */}
              {suggestedPlanIds.length > 0 ? (
                <div className={`grid gap-3 mb-5 ${suggestedPlanIds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {suggestedPlanIds.map((p) => {
                    const planLimits = getPlanLimits(p);
                    const price = PLAN_PRICES[p];
                    const displayPrice = price ? (annual ? price.annual : price.monthly) : null;
                    const isLoading = loadingPlan === p;
                    return (
                      <div key={p} className="rounded-xl p-4" style={{ background: `${BRAND}06`, border: `1px solid ${BRAND}20` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-sm" style={{ color: 'var(--heading)' }}>{PLAN_LABELS[p]}</span>
                          {displayPrice && (
                            <span className="text-xs font-bold" style={{ color: BRAND }}>
                              ${displayPrice.toLocaleString()}/mo
                            </span>
                          )}
                        </div>
                        <ul className="space-y-1 mb-3">
                          {[
                            planLimits.maxUsers === Infinity ? 'Unlimited users' : `Up to ${planLimits.maxUsers} users`,
                            planLimits.maxOrdersPerMonth === Infinity ? 'Unlimited orders' : `${planLimits.maxOrdersPerMonth} orders/mo`,
                          ].map((feat, i) => (
                            <li key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--body)' }}>
                              <Check size={11} className="text-emerald-500 flex-shrink-0" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => handleCheckout(p)}
                          disabled={Boolean(loadingPlan)}
                          className="w-full py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1 transition-all active:scale-[0.98] disabled:opacity-60"
                          style={{ background: BRAND }}
                        >
                          {isLoading
                            ? <><Loader2 size={12} className="animate-spin" /> Redirecting…</>
                            : <>Subscribe <ArrowRight size={12} /></>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Current plan is growth — suggest enterprise */
                <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#8b5cf6' }}>Enterprise</p>
                  <p className="text-sm mb-3" style={{ color: 'var(--body)' }}>Unlimited users, unlimited orders, dedicated support.</p>
                  <a
                    href="mailto:sales@zaproc.co.uk?subject=Enterprise%20plan%20inquiry"
                    onClick={onClose}
                    className="flex items-center gap-1 text-xs font-bold"
                    style={{ color: '#8b5cf6' }}
                  >
                    Contact sales <ArrowRight size={12} />
                  </a>
                </div>
              )}

              {/* Footer link */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { onClose?.(); navigate('/pricing'); }}
                  className="text-xs font-semibold transition-colors hover:opacity-70"
                  style={{ color: 'var(--caption)' }}
                >
                  View all plans
                </button>
                <button
                  onClick={onClose}
                  className="text-xs font-semibold transition-colors hover:opacity-70"
                  style={{ color: 'var(--caption)' }}
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
