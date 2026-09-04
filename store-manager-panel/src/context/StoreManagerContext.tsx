import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  OrderItem,
  PaymentMethod,
} from '../types';
import { storage } from '../utils/storage';
import { soundAlerts } from '../utils/audio';
import { ManagerApiClient } from '../utils/api';
import { joinStoreRoom, subscribeToNewOrders, subscribeToOrderUpdates } from '../utils/socket';

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
  simulateIncomingOrder: (customItems?: OrderItem[]) => Order | null;
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
  const [allIssues, setAllIssues] = useState<IssueTicket[]>(() => storage.getIssues());
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>(() => storage.getNotifications());

  const [session, setSession] = useState<{ managerId: string; storeId: string } | null>(() => storage.getActiveSession());
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => storage.getIsSoundMuted());

  const [incomingOrderId, setIncomingOrderId] = useState<string | null>(null);
  const [incomingOrderTimeRemaining, setIncomingOrderTimeRemaining] = useState<number>(60);
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
          logo: s.imageUrl || 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=800&q=80',
          bannerImage: s.imageUrl || 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=800&q=80',
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
          // Merge preserving any unsynced local orders
          const fetchedIds = new Set(mappedOrders.map((m) => m.id));
          const localOnly = prev.filter((p) => !fetchedIds.has(p.id) && p.status === 'WAITING_FOR_MANAGER');
          return [...localOnly, ...mappedOrders];
        });

        // Check for pending order
        const pending = mappedOrders.find((o) => o.status === 'WAITING_FOR_MANAGER');
        if (pending) {
          setIncomingOrderId((prevId) => prevId || pending.id);
          setIncomingOrderTimeRemaining((prevTime) => prevTime || 60);
        }
      }
    } catch (err: any) {
      console.warn('Backend sync failed, using local storage cache:', err.message);
    }
  }, [session?.managerId, session?.storeId]);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  // Current Manager and Store
  const currentManager = session ? allManagers.find((m) => m.id === session.managerId && m.isActive) || allManagers[0] : allManagers[0];
  const currentStore = currentManager ? (allStores.find((s) => s.id === currentManager.storeId) || allStores.find((s) => s.id === session?.storeId) || allStores[0]) : allStores[0];
  const isAuthenticated = Boolean(session || currentManager);

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

  const storeOrders = currentStore ? allOrders.filter((o) => o.storeId === currentStore.id || (currentStore.id === 'cmthk0r6e000qvnlem4n66bzb' && (!o.storeId || o.storeId === 'store-kfc-01'))) : allOrders;
  const storeFoodItems = currentStore ? allFoodItems.filter((i) => i.storeId === currentStore.id) : allFoodItems;
  const storeCategories = currentStore ? allCategories.filter((c) => c.storeId === currentStore.id) : allCategories;
  const storeIssues = currentStore ? allIssues.filter((i) => i.storeId === currentStore.id) : allIssues;
  const storeNotifications = currentStore ? allNotifications.filter((n) => n.storeId === currentStore.id) : allNotifications;

  const activeOrders = storeOrders.filter(
    (o) =>
      o.status === 'MANAGER_ACCEPTED' ||
      o.status === 'PREPARING' ||
      o.status === 'READY_FOR_PICKUP' ||
      o.status === 'OUT_FOR_DELIVERY' ||
      o.status === 'DELIVERY_ASSIGNED'
  );

  const incomingOrder = incomingOrderId ? storeOrders.find((o) => o.id === incomingOrderId && o.status === 'WAITING_FOR_MANAGER') || null : null;

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
  const acceptOrder = useCallback((orderId: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);

    soundAlerts.playSuccessChime();

    ManagerApiClient.acceptOrder(orderId)
      .then(() => refreshBackendData())
      .catch((err) => console.warn('Accept API warning:', err.message));

    setAllOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'MANAGER_ACCEPTED' } : o))
    );
    setIncomingOrderId(null);
  }, [refreshBackendData]);

  // Manager Reject Workflow
  const rejectOrder = useCallback((orderId: string, reason = 'Kitchen overloaded') => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);

    soundAlerts.playRejectTone();

    ManagerApiClient.rejectOrder(orderId, reason)
      .then(() => refreshBackendData())
      .catch((err) => console.warn('Reject API warning:', err.message));

    setAllOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'MANAGER_REJECTED', rejectionReason: reason } : o))
    );
    setIncomingOrderId(null);
  }, [refreshBackendData]);

  const startPreparingOrder = useCallback((orderId: string) => {
    soundAlerts.playSuccessChime();
    ManagerApiClient.startPreparingOrder(orderId).then(() => refreshBackendData()).catch(() => {});
    setAllOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'PREPARING' } : o))
    );
  }, [refreshBackendData]);

  const markFoodReady = useCallback((orderId: string) => {
    soundAlerts.playSuccessChime();
    ManagerApiClient.markFoodReady(orderId).then(() => refreshBackendData()).catch(() => {});
    setAllOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'READY_FOR_PICKUP' } : o))
    );
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
  const login = async (managerId: string, _password?: string) => {
    ManagerApiClient.setToken(managerId);
    setSession({ managerId, storeId: currentStore?.id || 'store-kfc' });
    await refreshBackendData();
    return { success: true, message: 'Logged in successfully' };
  };

  const logout = () => {
    ManagerApiClient.setToken(null);
    setSession(null);
  };

  const switchStoreForTesting = (storeId: string) => {
    const mgr = allManagers.find((m) => m.storeId === storeId);
    if (mgr) {
      setSession({ managerId: mgr.id, storeId });
    }
  };

  const resetPassword = async () => ({ success: true, message: 'Password updated' });

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
    }).then(() => refreshBackendData()).catch(() => {});
  };

  const updateFoodItem = (itemId: string, updates: Partial<FoodItem>) => {
    ManagerApiClient.updateMenuItem(itemId, updates).then(() => refreshBackendData()).catch(() => {});
  };

  const deleteFoodItem = (itemId: string) => {
    ManagerApiClient.deleteMenuItem(itemId).then(() => refreshBackendData()).catch(() => {});
  };

  const toggleItemAvailability = (itemId: string) => {
    const target = allFoodItems.find((i) => i.id === itemId);
    if (target) {
      ManagerApiClient.toggleItemAvailability(itemId, !target.isAvailable).then(() => refreshBackendData()).catch(() => {});
    }
  };

  const addCategory = (name: string, description?: string) => {
    if (!currentStore) return;
    ManagerApiClient.addCategory(currentStore.id, name, description).then(() => refreshBackendData()).catch(() => {});
  };

  const updateCategory = (categoryId: string, name: string, description?: string) => {
    ManagerApiClient.updateCategory(categoryId, name, description).then(() => refreshBackendData()).catch(() => {});
  };

  const deleteCategory = (categoryId: string) => {
    ManagerApiClient.deleteCategory(categoryId).then(() => refreshBackendData()).catch(() => {});
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
  const simulateIncomingOrder = () => null;

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
        availableStores: allStores,
        availableManagers: allManagers,
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
        simulateIncomingOrder,
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
