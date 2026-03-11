import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Package, Shield, TrendingUp, MessageSquare, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const TYPE_ICONS = {
  ORDER_SUBMITTED: Package,
  ORDER_SANITISED: Shield,
  ORDER_AWARDED: Package,
  STAGE_ADVANCED: TrendingUp,
  SUPPORT_TICKET: MessageSquare,
  SUPPORT_REPLY: MessageSquare,
  NCR_REPORT: AlertTriangle,
};

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };
    fetchNotifications();

    const channel = supabase.channel(`notifications-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${currentUser.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentUser]);

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', currentUser.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClick = async (n) => {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? '1d ago' : `${days}d ago`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-[200]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-semibold"
                onClick={markAllAsRead}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700">
            {notifications.length === 0 && (
              <li className="px-4 py-8 text-center text-gray-400 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </li>
            )}
            {notifications.map(n => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              return (
                <li
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-orange-50 dark:hover:bg-orange-950/20 ${!n.read ? 'bg-orange-50/60 dark:bg-orange-950/10' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${!n.read ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-slate-700'}`}>
                      <Icon size={14} className={!n.read ? 'text-orange-500' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm font-semibold truncate ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'}`}>
                          {n.title || n.type || 'Notification'}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      {n.link && (
                        <span className="text-[10px] text-orange-500 font-semibold mt-1 inline-block">View details →</span>
                      )}
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
