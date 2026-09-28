import {
  Store,
  StoreManager,
  FoodItem,
  MenuCategory,
  Order,
  IssueTicket,
  NotificationItem,
} from '../types';
import {
  INITIAL_STORES,
  INITIAL_MANAGERS,
  INITIAL_FOOD_ITEMS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_ISSUES,
  INITIAL_NOTIFICATIONS,
} from './mockData';

const STORAGE_KEYS = {
  STORES: 'store_manager_stores_v1',
  MANAGERS: 'store_manager_managers_v1',
  FOOD_ITEMS: 'store_manager_food_items_v1',
  CATEGORIES: 'store_manager_categories_v1',
  ORDERS: 'store_manager_orders_v1',
  ISSUES: 'store_manager_issues_v1',
  NOTIFICATIONS: 'store_manager_notifications_v1',
  ACTIVE_SESSION: 'store_manager_session_v1',
  SOUND_MUTED: 'store_manager_sound_muted_v1',
};

export const storage = {
  getStores(): Store[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STORES);
      return data ? JSON.parse(data) : INITIAL_STORES;
    } catch {
      return INITIAL_STORES;
    }
  },
  saveStores(stores: Store[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    } catch {}
  },

  getManagers(): StoreManager[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MANAGERS);
      return data ? JSON.parse(data) : INITIAL_MANAGERS;
    } catch {
      return INITIAL_MANAGERS;
    }
  },
  saveManagers(managers: StoreManager[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MANAGERS, JSON.stringify(managers));
    } catch {}
  },

  getFoodItems(): FoodItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOOD_ITEMS);
      return data ? JSON.parse(data) : INITIAL_FOOD_ITEMS;
    } catch {
      return INITIAL_FOOD_ITEMS;
    }
  },
  saveFoodItems(items: FoodItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, JSON.stringify(items));
    } catch {}
  },

  getCategories(): MenuCategory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },
  saveCategories(cats: MenuCategory[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    } catch {}
  },

  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  },
  saveOrders(orders: Order[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  },

  getIssues(): IssueTicket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ISSUES);
      return data ? JSON.parse(data) : INITIAL_ISSUES;
    } catch {
      return INITIAL_ISSUES;
    }
  },
  saveIssues(issues: IssueTicket[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
    } catch {}
  },

  getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },
  saveNotifications(notifs: NotificationItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    } catch {}
  },

  getActiveSession(): { managerId: string; storeId: string } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  saveActiveSession(session: { managerId: string; storeId: string } | null) {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      }
    } catch {}
  },

  getIsSoundMuted(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.SOUND_MUTED) === 'true';
    } catch {
      return false;
    }
  },
  saveIsSoundMuted(muted: boolean) {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, String(muted));
    } catch {}
  },

  resetAllData() {
    try {
      localStorage.clear();
    } catch {}
  },
};
