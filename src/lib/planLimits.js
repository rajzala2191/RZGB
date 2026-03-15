/**
 * Freemium plan limits and feature gates.
 * Source of truth for all plan-based restrictions.
 */

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    maxUsers: 2,
    maxOrdersPerMonth: 5,
    features: {
      rfqCreation: true,
      orderTracking: true,
      documentManagement: true,
      supplierProfiles: true,
      poCreation: true,
      invoiceSubmission: true,
      competitiveBidding: false,
      multiLotRfq: false,
      rfqTemplates: false,
      poAmendments: false,
      paymentMilestones: false,
      spendAnalytics: false,
      approvalWorkflows: false,
      auditTrailExport: false,
      supplierDiscovery: false,
      supplierScorecard: false,
      capabilityMatching: false,
      slackNotifications: false,
      webhookAccess: false,
      erpConnectors: false,
      prioritySupport: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    maxUsers: 5,
    maxOrdersPerMonth: 50,
    features: {
      rfqCreation: true,
      orderTracking: true,
      documentManagement: true,
      supplierProfiles: true,
      poCreation: true,
      invoiceSubmission: true,
      competitiveBidding: false,
      multiLotRfq: false,
      rfqTemplates: false,
      poAmendments: false,
      paymentMilestones: false,
      spendAnalytics: false,
      approvalWorkflows: false,
      auditTrailExport: false,
      supplierDiscovery: false,
      supplierScorecard: false,
      capabilityMatching: false,
      slackNotifications: false,
      webhookAccess: false,
      erpConnectors: false,
      prioritySupport: false,
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    maxUsers: 25,
    maxOrdersPerMonth: Infinity,
    features: {
      rfqCreation: true,
      orderTracking: true,
      documentManagement: true,
      supplierProfiles: true,
      poCreation: true,
      invoiceSubmission: true,
      competitiveBidding: true,
      multiLotRfq: true,
      rfqTemplates: true,
      poAmendments: true,
      paymentMilestones: true,
      spendAnalytics: true,
      approvalWorkflows: true,
      auditTrailExport: false,
      supplierDiscovery: true,
      supplierScorecard: true,
      capabilityMatching: true,
      slackNotifications: true,
      webhookAccess: false,
      erpConnectors: false,
      prioritySupport: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    maxUsers: Infinity,
    maxOrdersPerMonth: Infinity,
    features: {
      rfqCreation: true,
      orderTracking: true,
      documentManagement: true,
      supplierProfiles: true,
      poCreation: true,
      invoiceSubmission: true,
      competitiveBidding: true,
      multiLotRfq: true,
      rfqTemplates: true,
      poAmendments: true,
      paymentMilestones: true,
      spendAnalytics: true,
      approvalWorkflows: true,
      auditTrailExport: true,
      supplierDiscovery: true,
      supplierScorecard: true,
      capabilityMatching: true,
      slackNotifications: true,
      webhookAccess: true,
      erpConnectors: true,
      prioritySupport: true,
    },
  },
};

/** Returns the limits for a given plan id, defaulting to free. */
export const getPlanLimits = (planId) => PLANS[planId] ?? PLANS.free;

/** Check if a feature is available on a plan. */
export const planHasFeature = (planId, feature) => {
  const plan = getPlanLimits(planId);
  return Boolean(plan.features[feature]);
};

/** Human-friendly label for a plan. */
export const PLAN_LABELS = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

/** Plans in upgrade order for comparison. */
export const PLAN_ORDER = ['free', 'starter', 'growth', 'enterprise'];

/** Returns true if planA is lower tier than planB. */
export const isPlanLower = (planA, planB) =>
  PLAN_ORDER.indexOf(planA) < PLAN_ORDER.indexOf(planB);

/** Suggested upgrade from current plan. */
export const nextPlan = (currentPlan) => {
  const idx = PLAN_ORDER.indexOf(currentPlan);
  return PLAN_ORDER[idx + 1] ?? null;
};
