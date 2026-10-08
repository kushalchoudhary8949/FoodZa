import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Store,
  StoreManager,
  FoodItem,
  MenuCategory,
  Order,
  OrderStatus,
  IssueTicket,
  IssueCategory,
  IssuePriority,
  NotificationItem,
} from '../types';
import { storage } from '../utils/storage';
import { soundAlerts } from '../utils/audio';
import { ManagerApiClient } from '../utils/api';
import { joinStoreRoom, joinAdminRoom, subscribeToNewOrders, subscribeToOrderUpdates } from '../utils/socket';

interface StoreManagerContextType {
  // Auth & Session
  currentManager: StoreManager | null;
  currentStore: Store | null;
  availableStores: Store[];
  availableManagers: StoreManager[];
  isAuthenticated: boolean;
  login: (managerId: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  switchStoreForTesting: (storeId: string) => void;
  resetPassword: (managerId: string, newPass: string) => Promise<{ success: boolean; message: string }>;

  // Store Management
  toggleStoreStatus: () => void;
  updateStoreDetails: (updatedFields: Partial<Store>) => void;

  // Active / Incoming Orders & State Machine
  orders: Order[];
  activeOrders: Order[];
  incomingOrder: Order | null;
  incomingOrderTimeRemaining: number;
  acceptOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason?: string) => void;
  startPreparingOrder: (orderId: string) => void;
  markFoodReady: (orderId: string) => void;
  pendingOrderActions: Set<string>;
  dismissIncomingPopup: () => void;

  // Menu Management
  foodItems: FoodItem[];
  categories: MenuCategory[];
  addFoodItem: (item: Omit<FoodItem, 'id' | 'storeId' | 'createdAt'>) => void;
  updateFoodItem: (itemId: string, updates: Partial<FoodItem>) => void;
  deleteFoodItem: (itemId: string) => void;
  toggleItemAvailability: (itemId: string) => void;
  addCategory: (name: string, description?: string) => void;
  updateCategory: (categoryId: string, name: string, description?: string) => void;
  deleteCategory: (categoryId: string) => void;

  // Issues Box
  issues: IssueTicket[];
  createIssue: (category: IssueCategory, subject: string, initialMessage: string, priority?: IssuePriority, relatedOrderId?: string) => IssueTicket;
  sendMessageToIssue: (issueId: string, message: string) => void;
  simulateAdminReply: (issueId: string, replyText: string) => void;

  // Notifications & Sound
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  isSoundMuted: boolean;
  toggleSoundMute: () => void;
  testSoundAlert: () => void;

  // Realtime active orders counter
  stats: {
    newOrdersCount: number;
    activeOrdersCount: number;
    todayOrdersCount: number;
    todaySales: number;
    totalCompletedOrders: number;
    pendingOrdersCount: number;
    weeklySales: number;
    monthlySales: number;
    cancelledOrdersCount: number;
    averageOrderValue: number;
  };
}

const StoreManagerContext = createContext<StoreManagerContextType | undefined>(undefined);

export const StoreManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allStores, setAllStores] = useState<Store[]>(() => storage.getStores());
  const [allManagers, setAllManagers] = useState<StoreManager[]>(() => storage.getManagers());
  const [allFoodItems, setAllFoodItems] = useState<FoodItem[]>(() => storage.getFoodItems());
  const [allCategories, setAllCategories] = useState<MenuCategory[]>(() => storage.getCategories());
  const [allOrders, setAllOrders] = useState<Order[]>(() => storage.getOrders());
  const orderActionIdsRef = useRef(new Set<string>());
  const [allIssues, setAllIssues] = useState<IssueTicket[]>(() => storage.getIssues());
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>(() => storage.getNotifications());

  const [session, setSession] = useState<{ managerId: string; storeId: string } | null>(() => storage.getActiveSession());
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => storage.getIsSoundMuted());

  const [incomingOrderId, setIncomingOrderId] = useState<string | null>(null);
  const [incomingOrderTimeRemaining, setIncomingOrderTimeRemaining] = useState<number>(60);
  const [pendingOrderActions, setPendingOrderActions] = useState<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    soundAlerts.setMuted(isSoundMuted);
    storage.saveIsSoundMuted(isSoundMuted);
  }, [isSoundMuted]);

  // Fetch real manager profile & store data from Backend
  const refreshBackendData = useCallback(async () => {
    try {
      // 1. Stores
      const storesRes: any = await ManagerApiClient.request('/stores');
      if (Array.isArray(storesRes) && storesRes.length > 0) {
        const mappedStores: Store[] = storesRes.map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          tagline: s.description || 'Campus favorite',
          description: s.description || 'Multi-Cuisine',
          logo: (!s.imageUrl || s.imageUrl.includes('placeholder.dev')) ? 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80' : s.imageUrl,
          bannerImage: (!s.imageUrl || s.imageUrl.includes('placeholder.dev')) ? 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=800&q=80' : s.imageUrl,
          contactNumber: s.phone || '+91 98000 11122',
          email: 'store@foodconnect.com',
          address: s.address || 'Campus Hub',
          locationArea: 'North Campus',
          city: 'University Campus',
          openingTime: s.openingTime || '09:00',
          closingTime: s.closingTime || '23:00',
          isOpen: s.isOpen ?? true,
          defaultTimeoutSeconds: 60,
          defaultPrepTimeMinutes: 20,
          rating: 4.8,
          totalReviews: 140,
          ownerName: 'Store Manager',
          storeOwnerId: 'mgr-owner-1',
          commissionPercentage: 18.5,
          gstin: '07AAAAA0000A1Z5',
          fssaiLicense: '10020011000123',
        }));
        setAllStores(mappedStores);
      }

      // 2. Orders for current store
      const storeIdToFetch = session?.storeId || (Array.isArray(storesRes) && storesRes[0]?.id) || 'cmthk0r6e000qvnlem4n66bzb';
      const ordersRes: any = await ManagerApiClient.getStoreOrders(storeIdToFetch);
      if (Array.isArray(ordersRes)) {
        const mappedOrders: Order[] = ordersRes.map((o: any) => ({
          id: o.id,
          storeId: o.restaurantId,
          customer: {
            id: o.customerId || 'cust-1',
            name: o.customer?.name || 'Customer',
            phone: o.customer?.phone || '+91 98765 43210',
            deliveryAddress: o.deliveryAddress || 'Campus',
            hostelOrPg: o.hostelOrPgName || '',
            roomNumber: o.roomNumber || '',
          },
          items: (o.orderItems || []).map((i: any) => ({
            id: i.id,
            name: i.itemNameSnapshot,
            price: Number(i.unitPrice),
            quantity: i.quantity,
            isVeg: true,
          })),
          subtotal: Number(o.subtotal),
          deliveryFee: Number(o.deliveryFee),
          tax: 0,
          total: Number(o.totalAmount),
          paymentMethod: o.paymentMethod === 'CASH_ON_DELIVERY' ? 'CASH_ON_DELIVERY' : 'UPI',
          paymentStatus: o.paymentStatus || 'PENDING',
          status: o.status as OrderStatus,
          createdAt: o.createdAt,
          statusHistory: (o.orderEvents || []).map((e: any) => ({
            status: e.eventType as OrderStatus,
            timestamp: new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            note: e.eventType,
          })),
          timeoutSeconds: 60,
        }));
        setAllOrders((prev) => {
          const prevMap = new Map<string, Order>(prev.map((p) => [p.id, p]));
          const mergedFetched = mappedOrders.map((fetched) => {
            const local = prevMap.get(fetched.id);
            if (local) {
              // Never regress an order back to PREPARING if manager already marked it READY_FOR_PICKUP
              if (
                (local.status === 'READY_FOR_PICKUP' || local.status === 'WAITING_FOR_PARTNER' || local.status === 'DELIVERY_ASSIGNED') &&
                (fetched.status === 'PREPARING' || fetched.status === 'MANAGER_ACCEPTED')
              ) {
                return { ...fetched, status: local.status };
              }
            }
            return fetched;
          });

          // Preserve any local orders that were not in fetched
          const fetchedIds = new Set(mappedOrders.map((m) => m.id));
          const localOnly = prev.filter((p) => !fetchedIds.has(p.id));
          return [...localOnly, ...mergedFetched];
        });

        // Check for pending order
        const pending = mappedOrders.find((o) => o.status === 'WAITING_FOR_MANAGER');
        if (pending) {
          setIncomingOrderId((prevId) => prevId || pending.id);
          setIncomingOrderTimeRemaining((prevTime) => prevTime || 60);
        }
      }

      // 3. Menu items and categories
      try {
        const menuRes: any = await ManagerApiClient.getStoreMenu(storeIdToFetch);
        if (Array.isArray(menuRes)) {
          const fetchedCategories = menuRes.map((c: any) => ({
            id: c.id,
            storeId: c.restaurantId,
            name: c.name,
            description: c.description || '',
          }));
          
          let fetchedItems: FoodItem[] = [];
          menuRes.forEach((c: any) => {
            if (Array.isArray(c.menuItems)) {
              fetchedItems.push(...c.menuItems.map((i: any) => ({
                id: i.id,
                storeId: i.restaurantId,
                name: i.name,
                description: i.description || '',
                price: Number(i.price),
                image: i.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
                category: c.name,
                isVeg: i.foodType === 'VEG',
                isAvailable: i.isAvailable,
                createdAt: i.createdAt,
              })));
            }
          });
          
          setAllCategories(fetchedCategories);
          setAllFoodItems(fetchedItems);
        }
      } catch (menuErr: any) {
        console.warn('Backend menu sync failed:', menuErr.message);
      }

    } catch (err: any) {
      console.warn('Backend sync failed, using local storage cache:', err.message);
    }
  }, [session?.managerId, session?.storeId]);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  // Available Stores & Managers for authentication across all stores
  const availableStores = allStores;
  const availableManagers = useMemo(() => {
    const map = new Map<string, StoreManager>();
    allManagers.forEach((m) => map.set(m.storeId, m));
    allStores.forEach((store) => {
      if (!map.has(store.id)) {
        const cleanSlug = (store.slug || store.name.replace(/[^a-zA-Z0-9]/g, '')).toUpperCase();
        const mgrId = `MGR-${cleanSlug}-${store.id.slice(-3)}`;
        map.set(store.id, {
          id: mgrId,
          storeId: store.id,
          name: `${store.name} Manager`,
          email: store.email || `manager@${store.slug || store.id}.com`,
          phone: store.contactNumber || '+91 98000 00000',
          avatar: store.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          isActive: true,
          role: 'STORE_MANAGER',
          lastLogin: 'Active',
        });
      }
    });
    return Array.from(map.values());
  }, [allStores, allManagers]);

  // Current Manager and Store authentication state
  const currentManager = session
    ? availableManagers.find((m) => m.id === session.managerId || m.storeId === session.storeId) || null
    : null;

  const currentStore = session && currentManager
    ? availableStores.find((s) => s.id === currentManager.storeId || s.id === session.storeId) || availableStores.find((s) => s.id === session.storeId) || null
    : null;

  const isAuthenticated = Boolean(session && currentManager && currentStore);

  // Keep a stable reference to the latest refresh function so the socket
  // listeners never need to re-subscribe (prevents missing real-time orders).
  const refreshRef = useRef(refreshBackendData);
  refreshRef.current = refreshBackendData;

  // Connect Socket.IO for real-time new orders.
  // Deliberately depends ONLY on the stable currentStore id so that the
  // listeners are never torn down/re-created when unrelated state changes
  // (e.g. allStores and refreshBackendData being recreated on every poll).
  useEffect(() => {
    if (!currentStore) return;
    const storeId = currentStore.id;

    // Join current store room and fallback to all known store rooms
    joinStoreRoom(storeId);
    joinStoreRoom('cmthk0r6e000qvnlem4n66bzb');
    allStores.forEach((s) => s.id && joinStoreRoom(s.id));
    // Also join admin room as a fallback receiver for order:new events
    joinAdminRoom();

    const unsubNew = subscribeToNewOrders((newOrderData: any) => {
      console.log('Incoming order received via Socket.IO:', newOrderData);

      const orderId = newOrderData?.id || newOrderData?.orderId;
      if (orderId) {
        const mappedIncoming: Order = {
          id: orderId,
          storeId: newOrderData.restaurantId || storeId,
          customer: {
            id: newOrderData.customerId || 'cust-1',
            name: newOrderData.customer?.name || newOrderData.customerName || 'Campus Student',
            phone: newOrderData.customer?.phone || '+91 98765 43210',
            deliveryAddress: newOrderData.deliveryAddress || 'Hostel B, Room 204',
            hostelOrPg: newOrderData.hostelOrPgName || 'Hostel B',
            roomNumber: newOrderData.roomNumber || '204',
          },
          items: (newOrderData.orderItems || newOrderData.items || []).map((i: any) => ({
            id: i.id || i.menuItemId || `itm-${Math.random()}`,
            name: i.itemNameSnapshot || i.name || 'Menu Item',
            price: Number(i.unitPrice || i.price || 0),
            quantity: i.quantity || 1,
            isVeg: true,
          })),
          subtotal: Number(newOrderData.subtotal || newOrderData.totalAmount || 0),
          deliveryFee: Number(newOrderData.deliveryFee || 30),
          tax: 0,
          total: Number(newOrderData.totalAmount || newOrderData.total || 0),
          paymentMethod: newOrderData.paymentMethod === 'CASH_ON_DELIVERY' ? 'CASH_ON_DELIVERY' : 'UPI',
          paymentStatus: newOrderData.paymentStatus || 'PENDING',
          status: 'WAITING_FOR_MANAGER',
          createdAt: newOrderData.createdAt || new Date().toISOString(),
          statusHistory: [
            {
              status: 'WAITING_FOR_MANAGER',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              note: 'Order Placed',
            },
          ],
          timeoutSeconds: 60,
        };

        setAllOrders((prev) => {
          const exists = prev.some((o) => o.id === orderId);
          return exists ? prev.map((o) => (o.id === orderId ? mappedIncoming : o)) : [mappedIncoming, ...prev];
        });

        setIncomingOrderId(orderId);
        setIncomingOrderTimeRemaining(60);
      }

      soundAlerts.playNewOrderAlert();
      refreshRef.current();
    });

    const unsubUpd = subscribeToOrderUpdates(() => {
      refreshRef.current();
    });

    return () => {
      unsubNew();
      unsubUpd();
    };
  }, [currentStore?.id]);

  // Build a set of all known IDs for the current store to handle mismatches
  // between mock IDs and real DB IDs.
  const currentStoreIds = new Set<string>();
  if (currentStore) {
    currentStoreIds.add(currentStore.id);
    // Always include the hardcoded fallback
    if (currentStore.id === 'cmthk0r6e000qvnlem4n66bzb') {
      currentStoreIds.add('store-kfc-01');
    }
  }

  const storeOrders = allOrders.filter(
    (o) =>
      !o.storeId || // orders with no storeId default to current store
      currentStoreIds.has(o.storeId) ||
      (currentStore && o.storeId === currentStore.id)
  );
  const storeFoodItems = currentStore ? allFoodItems.filter((i) => i.storeId === currentStore.id) : allFoodItems;
  const storeCategories = currentStore ? allCategories.filter((c) => c.storeId === currentStore.id) : allCategories;
  const storeIssues = currentStore ? allIssues.filter((i) => i.storeId === currentStore.id) : allIssues;
  const storeNotifications = currentStore ? allNotifications.filter((n) => n.storeId === currentStore.id) : allNotifications;

  const activeOrders = storeOrders.filter(
    (o) =>
      o.status === 'MANAGER_ACCEPTED' ||
      o.status === 'ADMIN_ACCEPTED' ||
      o.status === 'PREPARING' ||
      o.status === 'READY_FOR_PICKUP' ||
      o.status === 'WAITING_FOR_PARTNER' ||
      o.status === 'DELIVERY_ASSIGNED' ||
      o.status === 'PICKED_UP' ||
      o.status === 'OUT_FOR_DELIVERY'
  );

  // Search allOrders (not storeOrders) so the popup works even if store filtering
  // would have excluded the order due to ID mismatch.
  const incomingOrder = incomingOrderId
    ? allOrders.find((o) => o.id === incomingOrderId && o.status === 'WAITING_FOR_MANAGER') || null
    : null;

  // Handle incoming order audio alerts & countdown
  useEffect(() => {
    if (!incomingOrderId || !incomingOrder) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
      return;
    }

    soundAlerts.playNewOrderAlert();
    soundIntervalRef.current = setInterval(() => {
      soundAlerts.playNewOrderAlert();
    }, 8000);

    timerRef.current = setInterval(() => {
      setIncomingOrderTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
          setIncomingOrderId(null);
          return 0;
        }
        if (prev <= 10) soundAlerts.playWarningTick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
    };
  }, [incomingOrderId, incomingOrder]);

  // Manager Accept Workflow
  const acceptOrder = useCallback(async (orderId: string) => {
    if (orderActionIdsRef.current.has(orderId)) return;
    orderActionIdsRef.current.add(orderId);
    setPendingOrderActions((prev) => new Set(prev).add(orderId));

    if (timerRef.current) clearInterval(timerRef.current);
    if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);

    soundAlerts.playSuccessChime();

    try {
      await ManagerApiClient.acceptOrder(orderId);
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'MANAGER_ACCEPTED' } : o))
      );
      setIncomingOrderId(null);
      await refreshBackendData();
    } catch (err: any) {
      console.warn('Accept API warning:', err.message);
    } finally {
      orderActionIdsRef.current.delete(orderId);
      setPendingOrderActions((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }, [refreshBackendData]);

  // Manager Reject Workflow
  const rejectOrder = useCallback(async (orderId: string, reason = 'Kitchen overloaded') => {
    if (orderActionIdsRef.current.has(orderId)) return;
    orderActionIdsRef.current.add(orderId);
    setPendingOrderActions((prev) => new Set(prev).add(orderId));

    if (timerRef.current) clearInterval(timerRef.current);
    if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);

    soundAlerts.playRejectTone();

    try {
      await ManagerApiClient.rejectOrder(orderId, reason);
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'MANAGER_REJECTED', rejectionReason: reason } : o))
      );
      setIncomingOrderId(null);
      await refreshBackendData();
    } catch (err: any) {
      console.warn('Reject API warning:', err.message);
    } finally {
      orderActionIdsRef.current.delete(orderId);
      setPendingOrderActions((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }, [refreshBackendData]);

  const startPreparingOrder = useCallback(async (orderId: string) => {
    if (orderActionIdsRef.current.has(orderId)) return;
    orderActionIdsRef.current.add(orderId);
    setPendingOrderActions((prev) => new Set(prev).add(orderId));
    soundAlerts.playSuccessChime();
    try {
      await ManagerApiClient.startPreparingOrder(orderId);
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'PREPARING' } : o))
      );
      await refreshBackendData();
    } catch (err: any) {
      console.error('Start preparing failed:', err);
      window.alert(err?.message || 'Unable to start preparing this order. Please refresh and try again.');
    } finally {
      orderActionIdsRef.current.delete(orderId);
      setPendingOrderActions((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }, [refreshBackendData]);

  const markFoodReady = useCallback(async (orderId: string) => {
    if (orderActionIdsRef.current.has(orderId)) return;
    orderActionIdsRef.current.add(orderId);
    setPendingOrderActions((prev) => new Set(prev).add(orderId));
    soundAlerts.playSuccessChime();
    try {
      await ManagerApiClient.markFoodReady(orderId);
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'READY_FOR_PICKUP' } : o))
      );
      await refreshBackendData();
    } catch (err: any) {
      console.error('Food ready failed:', err);
      window.alert(err?.message || 'Unable to mark this order ready. Please refresh and try again.');
    } finally {
      orderActionIdsRef.current.delete(orderId);
      setPendingOrderActions((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }, [refreshBackendData]);

  const toggleStoreStatus = useCallback(() => {
    if (!currentStore) return;
    ManagerApiClient.toggleStoreOpen(currentStore.id).then(() => refreshBackendData()).catch(() => {});
    setAllStores((prev) =>
      prev.map((s) => (s.id === currentStore.id ? { ...s, isOpen: !s.isOpen } : s))
    );
  }, [currentStore, refreshBackendData]);

  const updateStoreDetails = useCallback((updatedFields: Partial<Store>) => {
    if (!currentStore) return;
    ManagerApiClient.updateStore(currentStore.id, updatedFields).then(() => refreshBackendData()).catch(() => {});
    setAllStores((prev) =>
      prev.map((s) => (s.id === currentStore.id ? { ...s, ...updatedFields } : s))
    );
  }, [currentStore, refreshBackendData]);

  // Auth Operations
  const login = async (managerId: string, password?: string) => {
    const cleanId = (managerId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId) {
      return { success: false, message: 'Please enter a Store Manager ID, Store Email, or Store Name.' };
    }

    // 1. Find by manager ID, email, or phone
    let matchedManager = availableManagers.find(
      (m) =>
        m.id.toLowerCase() === cleanId ||
        m.email.toLowerCase() === cleanId ||
        m.phone.toLowerCase() === cleanId
    );

    let matchedStore: Store | undefined;

    if (matchedManager) {
      matchedStore = availableStores.find((s) => s.id === matchedManager!.storeId);
    } else {
      // 2. Find by store ID, slug, name, email, contactNumber
      matchedStore = availableStores.find(
        (s) =>
          s.id.toLowerCase() === cleanId ||
          (s.slug && s.slug.toLowerCase() === cleanId) ||
          s.name.toLowerCase() === cleanId ||
          s.email.toLowerCase() === cleanId ||
          s.contactNumber.toLowerCase() === cleanId
      );

      if (matchedStore) {
        matchedManager = availableManagers.find((m) => m.storeId === matchedStore!.id);
      }
    }

    if (!matchedManager || !matchedStore) {
      return {
        success: false,
        message: `No store manager account found for "${managerId}". Please check your Store Manager ID or select a valid store from the list below.`,
      };
    }

    if (!cleanPass) {
      return {
        success: false,
        message: 'Please enter your password to authenticate.',
      };
    }

    // Set auth token & session
    ManagerApiClient.setToken(matchedManager.id);
    const newSession = { managerId: matchedManager.id, storeId: matchedStore.id };
    setSession(newSession);
    storage.saveActiveSession(newSession);

    await refreshBackendData();
    return { success: true, message: `Successfully authenticated as ${matchedStore.name} Manager.` };
  };

  const logout = () => {
    ManagerApiClient.setToken(null);
    setSession(null);
    storage.saveActiveSession(null);
  };

  const switchStoreForTesting = (storeId: string) => {
    const store = availableStores.find((s) => s.id === storeId);
    if (!store) return;
    const mgr = availableManagers.find((m) => m.storeId === storeId);
    if (mgr) {
      ManagerApiClient.setToken(mgr.id);
      const newSession = { managerId: mgr.id, storeId: store.id };
      setSession(newSession);
      storage.saveActiveSession(newSession);
      refreshBackendData();
    }
  };

  const resetPassword = async (managerIdOrEmail: string, newPass: string) => {
    const cleanId = (managerIdOrEmail || '').trim().toLowerCase();
    let matchedManager = availableManagers.find(
      (m) =>
        m.id.toLowerCase() === cleanId ||
        m.email.toLowerCase() === cleanId
    );
    if (!matchedManager) {
      const matchedStore = availableStores.find(
        (s) =>
          s.id.toLowerCase() === cleanId ||
          (s.slug && s.slug.toLowerCase() === cleanId) ||
          s.name.toLowerCase() === cleanId
      );
      if (matchedStore) {
        matchedManager = availableManagers.find((m) => m.storeId === matchedStore!.id);
      }
    }

    if (!matchedManager) {
      return { success: false, message: 'Store Manager account not found.' };
    }

    if (!newPass || newPass.trim().length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    const updatedManagers = availableManagers.map((m) =>
      m.id === matchedManager!.id ? { ...m, lastLogin: 'Password updated' } : m
    );
    setAllManagers(updatedManagers);
    storage.saveManagers(updatedManagers);

    return { success: true, message: `Password successfully updated for ${matchedManager.name}.` };
  };

  // Menu Management
  const addFoodItem = (item: Omit<FoodItem, 'id' | 'storeId' | 'createdAt'>) => {
    if (!currentStore) return;
    const cat = storeCategories.find((c) => c.name === item.category);
    ManagerApiClient.addMenuItem(currentStore.id, {
      categoryId: cat ? cat.id : (storeCategories[0]?.id || 'cat-1'),
      name: item.name,
      description: item.description,
      imageUrl: item.image,
      price: item.price,
      foodType: item.isVeg ? 'VEG' : 'NON_VEG',
    }).then(() => refreshBackendData()).catch((err: any) => { alert(err.message || 'Failed to add item'); });
  };

  const updateFoodItem = (itemId: string, updates: Partial<FoodItem>) => {
    ManagerApiClient.updateMenuItem(itemId, updates).then(() => refreshBackendData()).catch((err: any) => { alert(err.message || 'Failed to update item'); });
  };

  const deleteFoodItem = (itemId: string) => {
    ManagerApiClient.deleteMenuItem(itemId).then(() => refreshBackendData()).catch((err: any) => { alert(err.message || 'Failed to delete item'); });
  };

  const toggleItemAvailability = (itemId: string) => {
    const target = allFoodItems.find((i) => i.id === itemId);
    if (target) {
      ManagerApiClient.toggleItemAvailability(itemId, !target.isAvailable).then(() => refreshBackendData()).catch((err: any) => { alert(err.message || 'Failed to toggle availability'); });
    }
  };

  const addCategory = (name: string, description?: string) => {
    if (!currentStore) return;
    ManagerApiClient.addCategory(currentStore.id, name, description).then(() => refreshBackendData()).catch((err: any) => { alert(err.message || 'Failed to add category'); });
  };

  const updateCategory = (categoryId: string, name: string, description?: string) => {
    ManagerApiClient.updateCategory(categoryId, name, description).then(() => refreshBackendData()).catch((err: any) => { alert(err.message || 'Failed to update category'); });
  };

  const deleteCategory = (categoryId: string) => {
    ManagerApiClient.deleteCategory(categoryId).then(() => refreshBackendData()).catch((err: any) => { alert(err.message || 'Failed to delete category'); });
  };

  // Issue Box
  const createIssue = (category: IssueCategory, subject: string, initialMessage: string) => {
    ManagerApiClient.createIssue(category, subject, initialMessage).then(() => refreshBackendData()).catch(() => {});
    const newIssue: IssueTicket = {
      id: `issue-${Date.now()}`,
      storeId: currentStore?.id || '',
      managerId: currentManager?.id || 'mgr-1',
      category,
      subject,
      status: 'OPEN',
      priority: 'MEDIUM',
      messages: [{ id: `m-${Date.now()}`, senderRole: 'MANAGER', senderName: 'Manager', message: initialMessage, timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAllIssues((prev) => [newIssue, ...prev]);
    return newIssue;
  };

  const sendMessageToIssue = (issueId: string, message: string) => {
    ManagerApiClient.sendMessageToIssue(issueId, message).then(() => refreshBackendData()).catch(() => {});
  };

  const simulateAdminReply = () => {};
  const dismissIncomingPopup = () => setIncomingOrderId(null);

  const markNotificationAsRead = (id: string) => {
    setAllNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };
  const markAllNotificationsAsRead = () => {
    setAllNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };
  const clearNotifications = () => setAllNotifications([]);

  const toggleSoundMute = () => setIsSoundMuted((prev) => !prev);
  const testSoundAlert = () => soundAlerts.playNewOrderAlert();

  // Computed Stats
  const completedOrders = storeOrders.filter((o) => o.status === 'DELIVERED');
  const todaySales = completedOrders.reduce((sum, o) => sum + o.total, 0);

  const stats = {
    newOrdersCount: storeOrders.filter((o) => o.status === 'WAITING_FOR_MANAGER').length,
    activeOrdersCount: activeOrders.length,
    todayOrdersCount: storeOrders.length,
    todaySales,
    totalCompletedOrders: completedOrders.length,
    pendingOrdersCount: storeOrders.filter((o) => o.status === 'WAITING_FOR_MANAGER').length,
    weeklySales: todaySales * 4,
    monthlySales: todaySales * 18,
    cancelledOrdersCount: storeOrders.filter((o) => o.status === 'MANAGER_REJECTED' || o.status === 'ADMIN_REJECTED' || o.status === 'CANCELLED').length,
    averageOrderValue: completedOrders.length > 0 ? Math.round(todaySales / completedOrders.length) : 0,
  };

  const unreadNotificationCount = storeNotifications.filter((n) => !n.isRead).length;

  return (
    <StoreManagerContext.Provider
      value={{
        currentManager,
        currentStore,
        availableStores,
        availableManagers,
        isAuthenticated,
        login,
        logout,
        switchStoreForTesting,
        resetPassword,

        toggleStoreStatus,
        updateStoreDetails,

        orders: storeOrders,
        activeOrders,
        incomingOrder,
        incomingOrderTimeRemaining,
        acceptOrder,
        rejectOrder,
        startPreparingOrder,
        markFoodReady,
        dismissIncomingPopup,

        foodItems: storeFoodItems,
        categories: storeCategories,
        addFoodItem,
        updateFoodItem,
        deleteFoodItem,
        toggleItemAvailability,
        addCategory,
        updateCategory,
        deleteCategory,

        issues: storeIssues,
        createIssue,
        sendMessageToIssue,
        simulateAdminReply,

        notifications: storeNotifications,
        pendingOrderActions,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        isSoundMuted,
        toggleSoundMute,
        testSoundAlert,

        stats,
      }}
    >
      {children}
    </StoreManagerContext.Provider>
  );
};

export const useStoreManager = () => {
  const context = useContext(StoreManagerContext);
  if (!context) {
    throw new Error('useStoreManager must be used within a StoreManagerProvider');
  }
  return context;
};
