import { NotificationLog, TargetAudience } from '../../types';
import { db } from '../storage';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export interface SendNotificationDto {
  title: string;
  message: string;
  targetAudience: any;
  targetStoreId?: string;
  targetStoreName?: string;
  storeId?: string;
  selectedRecipientsCount?: number;
}

export const notificationService = {
  async getNotifications(): Promise<any[]> {
    await delay();
    return db.getNotifications();
  },

  async sendNotification(data: SendNotificationDto): Promise<any> {
    await delay(350);
    const notifications = db.getNotifications();
    const admin = db.getAdmin();
    const stores = db.getStores();

    let storeName = data.targetStoreName;
    const storeId = data.targetStoreId || data.storeId;
    if (storeId && !storeName) {
      const store = stores.find((s) => s.id === storeId);
      storeName = store?.name;
    }

    // Determine estimated recipients count if not supplied
    let count = data.selectedRecipientsCount;
    if (!count) {
      switch (data.targetAudience) {
        case 'All Customers':
          count = 1680;
          break;
        case 'Selected Customers':
          count = 45;
          break;
        case 'All Delivery Partners':
          count = db.getPartners().length;
          break;
        case 'Selected Delivery Partners':
          count = 3;
          break;
        case 'All Store Owners/Managers':
          count = db.getManagers().length;
          break;
        case 'Selected Store Owners/Managers':
          count = 2;
          break;
        case 'Customers of a Selected Store':
          count = 280;
          break;
      }
    }

    const newLog: NotificationLog = {
      id: `notif_${Date.now()}`,
      title: data.title.trim(),
      message: data.message.trim(),
      targetAudience: data.targetAudience,
      storeId: data.storeId,
      storeName,
      selectedRecipientsCount: count,
      sentAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      sentBy: admin ? `${admin.name} (Admin)` : 'System Admin',
      status: 'Sent',
    };

    const updated = [newLog, ...notifications];
    db.setNotifications(updated);
    return newLog;
  },

  async deleteNotification(id: string): Promise<void> {
    await delay();
    const notifications = db.getNotifications();
    const filtered = notifications.filter((n) => n.id !== id);
    db.setNotifications(filtered);
  },
};
