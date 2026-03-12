import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchJobUpdatesByRzJobId,
  fetchOrderById,
  fetchOrderDocumentsByOrderId,
  withdrawOrderById,
} from '@/services/orderService';
import { supabase } from '@/lib/customSupabaseClient';
import ClientOrderDetailsView from '@/features/orders/presentational/ClientOrderDetailsView';

export default function ClientOrderDetailsContainer() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [order, setOrder] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      try {
        const { data, error } = await fetchOrderById(orderId);
        if (error) throw error;
        if (!data) {
          toast({
            title: 'Not Found',
            description: 'Order not found or you do not have permission to view it.',
            variant: 'destructive',
          });
          setOrder(null);
          return;
        }

        setOrder(data);

        if (data.rz_job_id) {
          const { data: timelineUpdates } = await fetchJobUpdatesByRzJobId(data.rz_job_id);
          if (timelineUpdates) setUpdates(timelineUpdates);
        }

        const { data: docs } = await fetchOrderDocumentsByOrderId(orderId);
        if (docs) setDocuments(docs);
      } catch (err) {
        console.error('ClientOrderDetailsContainer fetch error:', err);
        toast({
          title: 'Error',
          description: err.message || 'Failed to load order details.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, toast]);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const { error: withdrawError } = await withdrawOrderById(orderId);
      if (withdrawError) throw withdrawError;
      toast({
        title: 'Order Withdrawn',
        description: 'Your order has been successfully withdrawn.',
      });
      setOrder((prev) => ({ ...prev, order_status: 'WITHDRAWN' }));
      setConfirmWithdraw(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to withdraw.',
        variant: 'destructive',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleConfirmOrder = async () => {
    setConfirmingOrder(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ quote_accepted_at: new Date().toISOString(), quote_accepted_by: currentUser.id })
        .eq('id', orderId);
      if (error) throw error;
      setOrder(prev => ({ ...prev, quote_accepted_at: new Date().toISOString(), quote_accepted_by: currentUser.id }));
      toast({ title: 'Order Confirmed', description: 'You have confirmed this order.' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setConfirmingOrder(false);
    }
  };

  return (
    <ClientOrderDetailsView
      loading={loading}
      order={order}
      updates={updates}
      documents={documents}
      withdrawing={withdrawing}
      confirmWithdraw={confirmWithdraw}
      onBack={() => navigate('/client-dashboard/orders')}
      onTrackOrder={() => navigate(`/client-dashboard/orders/${orderId}/tracking`)}
      onRequestWithdraw={() => setConfirmWithdraw(true)}
      onCancelWithdraw={() => setConfirmWithdraw(false)}
      onWithdraw={handleWithdraw}
      onConfirmOrder={handleConfirmOrder}
      confirmingOrder={confirmingOrder}
    />
  );
}
