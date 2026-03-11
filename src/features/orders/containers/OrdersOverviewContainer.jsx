import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientOrders } from '@/contexts/ClientContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import { clearWithdrawnOrders, withdrawOrderById } from '@/services/orderService';
import OrdersOverviewView from '@/features/orders/presentational/OrdersOverviewView';

export default function OrdersOverviewContainer() {
  const { orders, loading, error, refreshOrders } = useClientOrders();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [withdrawingId, setWithdrawingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [clearingWithdrawn, setClearingWithdrawn] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  const handleWithdraw = async (orderId) => {
    setWithdrawingId(orderId);
    try {
      const { error: withdrawError } = await withdrawOrderById(orderId);
      if (withdrawError) throw withdrawError;
      toast({
        title: 'Order Withdrawn',
        description: 'Your order has been successfully withdrawn.',
      });
      refreshOrders?.();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to withdraw order.',
        variant: 'destructive',
      });
    } finally {
      setWithdrawingId(null);
      setConfirmId(null);
    }
  };

  const handleClearWithdrawn = async () => {
    setClearingWithdrawn(true);
    try {
      const withdrawnIds = orders
        .filter((order) => order.order_status === 'WITHDRAWN')
        .map((order) => order.id);

      if (!withdrawnIds.length) {
        toast({ title: 'No Withdrawn Orders' });
        return;
      }

      const cleared = await clearWithdrawnOrders(withdrawnIds);
      if (cleared > 0) {
        toast({ title: 'Cleared', description: `${cleared} order(s) cleared.` });
        refreshOrders?.();
      } else {
        toast({
          title: 'Error',
          description: 'Could not clear orders.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setClearingWithdrawn(false);
    }
  };

  return (
    <OrdersOverviewView
      orders={orders}
      loading={loading}
      error={error}
      isDark={isDark}
      withdrawingId={withdrawingId}
      confirmId={confirmId}
      clearingWithdrawn={clearingWithdrawn}
      hoveredRow={hoveredRow}
      onHoverRow={setHoveredRow}
      onLeaveRow={() => setHoveredRow(null)}
      onRequestWithdraw={setConfirmId}
      onCancelWithdraw={() => setConfirmId(null)}
      onWithdraw={handleWithdraw}
      onClearWithdrawn={handleClearWithdrawn}
      onCreateOrder={() => navigate('/client-dashboard/create-order')}
      onTrackOrder={(orderId) => navigate(`/client-dashboard/orders/${orderId}/tracking`)}
    />
  );
}
