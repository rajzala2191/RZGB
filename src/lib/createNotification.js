import { supabase } from '@/lib/customSupabaseClient';

export const createNotification = async ({ recipientId, senderId, type, title, message, link }) => {
  try {
    // If recipientId is an array, we handle batch notifications
    const recipients = Array.isArray(recipientId) ? recipientId : [recipientId];
    
    const payload = recipients.map(id => ({
      recipient_id: id,
      sender_id: senderId,
      type,
      title,
      message,
      link,
      read: false
    }));

    const { error } = await supabase.from('notifications').insert(payload);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};