import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchWorkspacePlan,
  fetchMonthlyOrderCount,
  fetchWorkspaceUserCount,
} from '@/services/subscriptionService';
import { getPlanLimits, planHasFeature } from '@/lib/planLimits';

const SubscriptionContext = createContext(undefined);

export const SubscriptionProvider = ({ children }) => {
  const { workspaceId, currentUser, isSuperAdmin } = useAuth();

  const [plan, setPlan] = useState('free');
  const [planStatus, setPlanStatus] = useState('active');
  const [planExpiresAt, setPlanExpiresAt] = useState(null);
  const [monthlyOrders, setMonthlyOrders] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const limits = getPlanLimits(plan);

  const refresh = useCallback(async () => {
    if (!workspaceId || !currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [planRes, ordersRes, usersRes] = await Promise.all([
        fetchWorkspacePlan(workspaceId),
        fetchMonthlyOrderCount(workspaceId),
        fetchWorkspaceUserCount(workspaceId),
      ]);

      if (planRes.data) {
        setPlan(planRes.data.plan ?? 'free');
        setPlanStatus(planRes.data.plan_status ?? 'active');
        setPlanExpiresAt(planRes.data.plan_expires_at ?? null);
      }
      setMonthlyOrders(ordersRes.data ?? 0);
      setUserCount(usersRes.data ?? 0);
    } catch (err) {
      console.error('SubscriptionContext: failed to load plan info', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, currentUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Check if a usage-based limit is reached. */
  const isAtLimit = useCallback(
    (limitKey) => {
      if (isSuperAdmin) return false; // super admins are never blocked
      if (limitKey === 'orders') return monthlyOrders >= limits.maxOrdersPerMonth;
      if (limitKey === 'users') return userCount >= limits.maxUsers;
      return false;
    },
    [isSuperAdmin, monthlyOrders, userCount, limits]
  );

  /** Check if a feature flag is available on the current plan. */
  const canUse = useCallback(
    (feature) => {
      if (isSuperAdmin) return true;
      return planHasFeature(plan, feature);
    },
    [isSuperAdmin, plan]
  );

  const value = {
    plan,
    planStatus,
    planExpiresAt,
    limits,
    monthlyOrders,
    userCount,
    loading,
    isAtLimit,
    canUse,
    refresh,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
};
