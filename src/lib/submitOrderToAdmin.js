import { supabase } from '@/lib/customSupabaseClient';
import { createNotification } from './createNotification';

export const submitOrderToAdmin = async ({ orderId, clientId, orderName, clientName }) => {
  try {
    // 1. Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        order_status: 'PENDING_ADMIN_SCRUB', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // 2. Log action in audit_logs
    await supabase.from('audit_logs').insert([{
      action: 'ORDER_SUBMITTED',
      order_id: orderId,
      details: `Order ${orderName} submitted to admin by ${clientName}`,
      status: 'SUCCESS'
    }]);

    // 3. Notify all admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const adminIds = admins.map(a => a.id);
      await createNotification({
        recipientId: adminIds,
        senderId: clientId,
        type: 'ORDER_SUBMITTED',
        title: 'New Order Submitted',
        message: `Client ${clientName} submitted order: ${orderName}`,
        link: `/control-centre/sanitisation-gate/review/${orderId}`
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting order to admin:', error);
    throw error;
  }
};