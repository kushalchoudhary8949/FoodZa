import React, { useState, useEffect } from 'react';
import { NotificationTargetAudience, AppNotification, Store } from '../../types';
import { notificationService } from '../../services/api/notificationService';
import { storeService } from '../../services/api/storeService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  Bell,
  Send,
  Users,
  Store as StoreIcon,
  Bike,
  History,
  CheckCircle2,
  Sparkles,
  Smartphone,
} from 'lucide-react';

export const NotificationPage: React.FC = () => {
  const { success, error } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] =
    useState<NotificationTargetAudience>('All customers');
  const [targetStoreId, setTargetStoreId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [notifs, stList] = await Promise.all([
        notificationService.getNotifications(),
        storeService.getStores(),
      ]);
      setNotifications(notifs);
      setStores(stList);
      if (stList.length > 0 && !targetStoreId) {
        setTargetStoreId(stList[0].id);
      }
    } catch {
      error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleDbChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'foodfleet_notifications') {
        loadData();
      }
    };
    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      error('Validation Error', 'Please enter both title and message.');
      return;
    }

    setIsSending(true);
    try {
      const storeName =
        targetAudience === 'Customers of a selected store'
          ? stores.find((s) => s.id === targetStoreId)?.name
          : undefined;

      await notificationService.sendNotification({
        title,
        message,
        targetAudience,
        targetStoreId:
          targetAudience === 'Customers of a selected store' ? targetStoreId : undefined,
        targetStoreName: storeName,
      });

      success('Notification Broadcasted', `Push message dispatched to ${targetAudience}.`);
      setTitle('');
      setMessage('');
      loadData();
    } catch (err: any) {
      error('Broadcast Failed', err.message);
    } finally {
      setIsSending(false);
    }
  };

  const getTargetIcon = (audience: NotificationTargetAudience) => {
    if (audience.includes('customers')) return <Users className="w-4 h-4 text-blue-600" />;
    if (audience.includes('delivery')) return <Bike className="w-4 h-4 text-purple-600" />;
    return <StoreIcon className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div id="notification-management-page" className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Push Notification Broadcasts</h2>
        <p className="text-xs text-slate-500">
          Compose and dispatch targeted system & promotional alerts to customers, managers, or riders
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Notification Creator Form */}
        <div className="lg:col-span-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Compose Push Alert</h3>
                <span className="text-[11px] text-slate-500">Firebase Cloud Messaging (FCM) Ready</span>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Audience *
                </label>
                <select
                  id="target-audience-select"
                  value={targetAudience}
                  onChange={(e) =>
                    setTargetAudience(e.target.value as NotificationTargetAudience)
                  }
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="All customers">All Customers</option>
                  <option value="Customers of a selected store">Customers of a Selected Store</option>
                  <option value="All delivery partners">All Delivery Partners (Fleet)</option>
                  <option value="Selected delivery partners">Selected Delivery Partners</option>
                  <option value="All store owners/managers">All Store Owners & Managers</option>
                  <option value="Selected store owners/managers">Selected Store Owners & Managers</option>
                  <option value="Selected customers">Selected Customer Segment</option>
                </select>
              </div>

              {/* Store Selector (if store specific) */}
              {targetAudience === 'Customers of a selected store' && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-amber-900 uppercase">
                    Select Store Outlet *
                  </label>
                  <select
                    id="notification-store-select"
                    value={targetStoreId}
                    onChange={(e) => setTargetStoreId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-amber-300 bg-white p-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Notification Title *
                </label>
                <input
                  id="notif-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midnight Craving Deals! 🍕"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Notification Message *
                </label>
                <textarea
                  id="notif-message-input"
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Get Flat ₹75 off on all hostel deliveries tonight with code NIGHTFEST. Order now before kitchens close!"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-slate-900 rounded-xl text-white space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  <Smartphone className="w-3 h-3 text-amber-400" /> Device Notification Preview
                </div>
                <div className="font-bold text-xs text-amber-400">
                  {title || 'Your Notification Title'}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                  {message || 'Your broadcast message preview will appear here on recipients devices...'}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                id="send-notification-btn"
                type="submit"
                size="md"
                isLoading={isSending}
                leftIcon={<Send className="w-4 h-4" />}
                className="w-full font-bold"
              >
                Send Notification
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: Sent History Log */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Sent Notification History</h3>
              </div>
              <span className="text-xs text-slate-400">{notifications.length} Sent</span>
            </div>

            {isLoading ? (
              <div className="p-4">
                <TableSkeleton rows={5} columns={3} />
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                title="No Broadcasts Sent Yet"
                description="Use the form on the left to send your first targeted push notification."
              />
            ) : (
              <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          {getTargetIcon(notif.targetAudience)}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{notif.title}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              To: {notif.targetAudience}
                              {notif.targetStoreName ? ` (${notif.targetStoreName})` : ''}
                            </span>
                            <span>•</span>
                            <span>{notif.sentAt}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="success" size="sm" dot>
                        Sent
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
