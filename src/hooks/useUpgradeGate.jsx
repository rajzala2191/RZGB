import { useState, useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';

/**
 * Hook that provides a `guard` function to wrap plan-limited actions.
 * Also manages the UpgradeModal open state.
 *
 * Usage:
 *   const { guard, upgradeModal } = useUpgradeGate();
 *
 *   // Somewhere in JSX:
 *   {upgradeModal}
 *
 *   // Before a plan-limited action:
 *   guard('orders', async () => {
 *     await createOrder(data);
 *   });
 *
 *   // Feature gate:
 *   guard({ type: 'feature', feature: 'spendAnalytics', featureName: 'Spend Analytics' }, () => {
 *     navigate('/control-centre/spend-analytics');
 *   });
 */

import UpgradeModal from '@/components/UpgradeModal';
import React from 'react';

export const useUpgradeGate = () => {
  const { isAtLimit, canUse } = useSubscription();
  const [modalConfig, setModalConfig] = useState(null); // { limitType, featureName } | null

  const close = useCallback(() => setModalConfig(null), []);

  /**
   * Guard an action against plan limits.
   *
   * @param {string | { type: 'orders'|'users'|'feature', feature?: string, featureName?: string }} limitKey
   * @param {Function} action - async function to run if allowed
   */
  const guard = useCallback(
    async (limitKey, action) => {
      // Normalise input
      let limitType, feature, featureName;
      if (typeof limitKey === 'string') {
        limitType = limitKey;
      } else {
        limitType = limitKey.type;
        feature = limitKey.feature;
        featureName = limitKey.featureName;
      }

      // Check feature gate
      if (limitType === 'feature') {
        if (!canUse(feature)) {
          setModalConfig({ limitType: 'feature', featureName });
          return false;
        }
        await action?.();
        return true;
      }

      // Check usage limit
      if (isAtLimit(limitType)) {
        setModalConfig({ limitType });
        return false;
      }

      await action?.();
      return true;
    },
    [isAtLimit, canUse]
  );

  const upgradeModal = modalConfig ? (
    <UpgradeModal
      open={Boolean(modalConfig)}
      onClose={close}
      limitType={modalConfig.limitType}
      featureName={modalConfig.featureName}
    />
  ) : null;

  return { guard, upgradeModal };
};
