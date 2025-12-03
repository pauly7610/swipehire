import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Briefcase, MessageCircle, Calendar, Gift, X, ClipboardList } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 3 seconds for near-instant updates
    const interval = setInterval(loadNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const notifs = await base44.entities.Notification.filter({ user_id: currentUser.id }, '-created_date', 20);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (e) {
      // Not logged in
    }
  };

  const markAsRead = async (notif) => {
    if (!notif.is_read) {
      await base44.entities.Notification.update(notif.id, { is_read: true });
      setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'job_match': return <Briefcase className="w-5 h-5 text-pink-500" />;
      case 'new_match': return <Gift className="w-5 h-5 text-green-500" />;
      case 'interview': return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'message': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'status_change': return <ClipboardList className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed left-4 right-4 top-16 md:left-auto md:right-4 md:top-16 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-sm text-pink-600 hover:text-pink-700">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
  notifications.map((notif) => {
                    const getNotifLink = () => {
                      // Use navigate_to if specified
                      if (notif.navigate_to) {
                        return createPageUrl(notif.navigate_to);
                      }
                      if (notif.type === 'status_change') {
                        return createPageUrl('ApplicationTracker');
                      }
                      if (notif.match_id) {
                        return createPageUrl('Chat') + `?matchId=${notif.match_id}`;
                      }
                      if (notif.type === 'new_match') {
                        return createPageUrl('Matches');
                      }
                      if (notif.type === 'interview') {
                        return createPageUrl('Matches');
                      }
                      return null;
                    };
                    const link = getNotifLink();
                    
                    return (
                      <Link
                        key={notif.id}
                        to={link || '#'}
                        onClick={(e) => {
                          markAsRead(notif);
                          if (link) {
                            setIsOpen(false);
                          } else {
                            e.preventDefault();
                          }
                        }}
                        className={`block p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notif.is_read ? 'bg-pink-50/50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            {getIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notif.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                              {notif.title}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(notif.created_date), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              <Link
                to={createPageUrl('JobAlerts')}
                className="block p-3 text-center text-sm text-pink-600 hover:bg-gray-50 border-t"
                onClick={() => setIsOpen(false)}
              >
                Manage Job Alerts
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}