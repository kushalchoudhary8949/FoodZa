import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  Bike,
  AlertTriangle,
  MessageSquare,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { NotificationType } from '../../types';

interface NotificationsViewProps {
  setActiveNav: (nav: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ setActiveNav }) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useStoreManager();

  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const filteredNotifications = notifications.filter((n) => {
    if (filterUnreadOnly && n.isRead) return false;
    return true;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'NEW_ORDER':
        return <ShoppingBag className="w-4 h-4 text-amber-400" />;
      case 'DELIVERY_PARTNER_ASSIGNED':
      case 'DELIVERY_PARTNER_ARRIVED':
        return <Bike className="w-4 h-4 text-blue-400" />;
      case 'ORDER_CANCELLED':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'ADMIN_MESSAGE':
      case 'ISSUE_UPDATE':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Notifications & Alerts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {notifications.filter((n) => !n.isRead).length} Unread
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time feed of order placements, rider arrivals, cancellation alerts, and admin updates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              filterUnreadOnly
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {filterUnreadOnly ? 'Showing Unread Only' : 'Filter: All'}
          </button>

          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-amber-600" />
            <span>Mark all as read</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No notifications right now</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filterUnreadOnly ? 'All notifications have been read.' : 'Your notification stream is clean.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            return (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) markNotificationAsRead(notification.id);
                  if (notification.actionUrl === '/orders/active') setActiveNav('active-orders');
                  if (notification.actionUrl === '/orders/history') setActiveNav('order-history');
                  if (notification.actionUrl === '/issues') setActiveNav('issues');
                }}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  notification.isRead
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    : 'bg-white border-amber-400 shadow-sm hover:border-amber-500 ring-1 ring-amber-400/30'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      notification.isRead
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-800 ring-2 ring-amber-400/20'
                    }`}
                  >
                    {getIcon(notification.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold leading-snug ${
                          notification.isRead ? 'text-slate-700' : 'text-slate-900 font-extrabold'
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
                      <span>{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                      {notification.relatedOrderId && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 font-bold">Order #{notification.relatedOrderId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right chevron or link */}
                <div className="shrink-0 flex items-center pt-2 text-slate-400 hover:text-amber-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
