import {
  AdminUser,
  Store,
  StoreManager,
  DeliveryPartner,
  MenuCategory,
  MenuItem,
  Order,
  Offer,
  NotificationLog,
} from '../types';
import {
  INITIAL_ADMIN,
  INITIAL_STORES,
  INITIAL_MANAGERS,
  INITIAL_DELIVERY_PARTNERS,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_OFFERS,
  INITIAL_NOTIFICATIONS,
} from './mockData';

const KEYS = {
  ADMIN: 'foodfleet_admin_session',
  STORES: 'foodfleet_stores',
  MANAGERS: 'foodfleet_managers',
  PARTNERS: 'foodfleet_partners',
  CATEGORIES: 'foodfleet_categories',
  MENU_ITEMS: 'foodfleet_menu_items',
  ORDERS: 'foodfleet_orders',
  OFFERS: 'foodfleet_offers',
  NOTIFICATIONS: 'foodfleet_notifications',
  SETTINGS: 'foodfleet_settings',
};

// Helper for local storage access with in-memory fallback
class MockDatabase {
  private memoryStore: Record<string, string> = {};

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = typeof window !== 'undefined' ? localStorage.getItem(key) : this.memoryStore[key];
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      const json = JSON.stringify(value);
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, json);
      }
      this.memoryStore[key] = json;
      // Dispatch custom event for reactive UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foodfleet_db_change', { detail: { key } }));
      }
    } catch (e) {
      console.error('Failed to write to storage', e);
    }
  }

  // Admin
  getAdmin(): AdminUser | null {
    return this.getItem<AdminUser | null>(KEYS.ADMIN, INITIAL_ADMIN);
  }

  setAdmin(admin: AdminUser | null): void {
    this.setItem(KEYS.ADMIN, admin);
  }

  // Stores
  getStores(): Store[] {
    return this.getItem<Store[]>(KEYS.STORES, INITIAL_STORES);
  }

  setStores(stores: Store[]): void {
    this.setItem(KEYS.STORES, stores);
  }

  // Managers
  getManagers(): StoreManager[] {
    return this.getItem<StoreManager[]>(KEYS.MANAGERS, INITIAL_MANAGERS);
  }

  setManagers(managers: StoreManager[]): void {
    this.setItem(KEYS.MANAGERS, managers);
  }

  // Partners
  getPartners(): DeliveryPartner[] {
    return this.getItem<DeliveryPartner[]>(KEYS.PARTNERS, INITIAL_DELIVERY_PARTNERS);
  }

  setPartners(partners: DeliveryPartner[]): void {
    this.setItem(KEYS.PARTNERS, partners);
  }

  // Menu Categories
  getCategories(): MenuCategory[] {
    return this.getItem<MenuCategory[]>(KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  setCategories(categories: MenuCategory[]): void {
    this.setItem(KEYS.CATEGORIES, categories);
  }

  // Menu Items
  getMenuItems(): MenuItem[] {
    return this.getItem<MenuItem[]>(KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
  }

  setMenuItems(items: MenuItem[]): void {
    this.setItem(KEYS.MENU_ITEMS, items);
  }

  // Orders
  getOrders(): Order[] {
    return this.getItem<Order[]>(KEYS.ORDERS, INITIAL_ORDERS);
  }

  setOrders(orders: Order[]): void {
    this.setItem(KEYS.ORDERS, orders);
  }

  // Offers
  getOffers(): Offer[] {
    return this.getItem<Offer[]>(KEYS.OFFERS, INITIAL_OFFERS);
  }

  setOffers(offers: Offer[]): void {
    this.setItem(KEYS.OFFERS, offers);
  }

  // Notifications
  getNotifications(): NotificationLog[] {
    return this.getItem<NotificationLog[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  setNotifications(logs: NotificationLog[]): void {
    this.setItem(KEYS.NOTIFICATIONS, logs);
  }

  // Reset database to initial seeds
  resetToDefaults(): void {
    this.setStores(INITIAL_STORES);
    this.setManagers(INITIAL_MANAGERS);
    this.setPartners(INITIAL_DELIVERY_PARTNERS);
    this.setCategories(INITIAL_CATEGORIES);
    this.setMenuItems(INITIAL_MENU_ITEMS);
    this.setOrders(INITIAL_ORDERS);
    this.setOffers(INITIAL_OFFERS);
    this.setNotifications(INITIAL_NOTIFICATIONS);
    this.setAdmin(INITIAL_ADMIN);
  }
}

export const db = new MockDatabase();
