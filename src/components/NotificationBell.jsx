import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };
    fetchNotifications();
    // Realtime subscription
    const channel = supabase.channel(`notifications-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${currentUser.id}` }, payload => {
        fetchNotifications();
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentUser]);

  // Mark all as read
  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', currentUser.id)
      .eq('read', false);
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-gray-100"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <span className="font-semibold text-gray-800">Notifications</span>
            <button className="text-xs text-orange-500 hover:underline" onClick={markAllAsRead}>Mark all as read</button>
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-gray-400">No notifications</li>
            )}
            {notifications.map(n => (
              <li key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-orange-50' : ''}`}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-gray-800">{n.title || n.type || 'Notification'}</span>
                  <span className="text-sm text-gray-600">{n.message}</span>
                  {n.link && <a href={n.link} className="text-xs text-blue-500 hover:underline mt-1">View</a>}
                  <span className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
