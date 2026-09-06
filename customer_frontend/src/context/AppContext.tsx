import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  Store,
  MenuItem,
  CartState,
  CartItem,
  Order,
  OrderStatus,
  CustomerDeliveryDetails,
  NavigationTab,
} from '../types';
import { STORES, MENU_ITEMS } from '../data/stores';
import confetti from 'canvas-confetti';
import { ApiClient } from '../utils/api';
import { getSocket, joinOrderRoom, subscribeToOrderUpdates } from '../utils/socket';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

interface AppContextType {
  // Auth
  user: UserProfile | null;
  isAuthOpen: boolean;
  openAuthModal: (redirectAction?: () => void) => void;
  closeAuthModal: () => void;
  login: (phone: string, otpCode?: string) => boolean;
  signup: (data: { name: string; phone: string; address: string; hostelOrPg?: string; roomNumber?: string }) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  logout: () => void;

  // Stores & Menu
  stores: Store[];
  menuItems: MenuItem[];
  selectedStore: Store | null;
  selectStore: (store: Store | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCuisine: string;
  setSelectedCuisine: (cuisine: string) => void;
  vegOnlyFilter: boolean;
  setVegOnlyFilter: (vegOnly: boolean) => void;

  // Cart
  cart: CartState;
  cartStore: Store | null;
  addToCart: (item: MenuItem) => boolean;
  updateQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartTotal: number;
  cartTotalCount: number;

  // Switch Store Conflict Modal
  storeConflictModal: { isOpen: boolean; pendingItem: MenuItem | null; currentStoreName: string; newStoreName: string } | null;
  confirmStoreSwitch: () => void;
  cancelStoreSwitch: () => void;

  // Checkout
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  placeOrder: (details: CustomerDeliveryDetails, paymentMethod?: 'Cash on Delivery' | 'UPI / Online (Upcoming)') => Promise<Order | null>;
  isPlacingOrder: boolean;

  // Orders & Tracking
  orders: Order[];
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
  activeOrder: Order | null;
  cancelOrder: (orderId: string, reason?: string) => void;
  simulateBackendStatusChange: (orderId: string, status: OrderStatus, reason?: string) => void;
  isAutoSimulationActive: boolean;
  setIsAutoSimulationActive: (active: boolean) => void;

  // Success Modal
  orderSuccessModal: Order | null;
  closeOrderSuccessModal: () => void;

  // Navigation
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  navigateToTracking: (orderId: string) => void;

  // Toast
  toasts: ToastState[];
  showToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Real stores & menu state from backend
  const [storesList, setStoresList] = useState<Store[]>(STORES);
  const [currentMenuItems, setCurrentMenuItems] = useState<MenuItem[]>(MENU_ITEMS);

  // User auth state
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('qb_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<(() => void) | null>(null);

  // Store & Menu state
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [vegOnlyFilter, setVegOnlyFilter] = useState<boolean>(false);

  // Cart state
  const [cart, setCart] = useState<CartState>(() => {
    const saved = localStorage.getItem('qb_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { storeId: null, items: [] };
      }
    }
    return { storeId: null, items: [] };
  });

  const [storeConflictModal, setStoreConflictModal] = useState<{
    isOpen: boolean;
    pendingItem: MenuItem | null;
    currentStoreName: string;
    newStoreName: string;
  } | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<Order | null>(null);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [isAutoSimulationActive, setIsAutoSimulationActive] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastState[]>([]);

  // Fetch real stores from Backend on mount
  useEffect(() => {
    ApiClient.getStores()
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: Store[] = data.map((s: any) => ({
            id: s.id,
            name: s.name,
            cuisine: s.description || 'Multi-Cuisine',
            rating: 4.8,
            totalRatings: 120,
            deliveryTime: '20-30 min',
            deliveryFee: 30,
            minOrder: 100,
            isVegOnly: false,
            isOpen: s.isOpen ?? true,
            image: (!s.imageUrl || s.imageUrl.includes('placeholder.dev')) ? 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=800&q=80' : s.imageUrl,
            logo: (!s.imageUrl || s.imageUrl.includes('placeholder.dev')) ? 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80' : s.imageUrl,
            location: s.address || 'Campus Hub',
            tagline: s.description || 'Campus favorite',
          }));
          setStoresList(mapped);
        }
      })
      .catch((err) => {
        console.warn('Backend stores fetch failed, fallback to local stores:', err.message);
      });
  }, []);

  // Fetch menu when store is selected
  useEffect(() => {
    if (selectedStore) {
      ApiClient.getStoreMenu(selectedStore.id)
        .then((categories: any[]) => {
          if (categories && Array.isArray(categories)) {
            const items: MenuItem[] = [];
            categories.forEach((cat) => {
              if (cat.menuItems && Array.isArray(cat.menuItems)) {
                cat.menuItems.forEach((item: any) => {
                  items.push({
                    id: item.id,
                    storeId: selectedStore.id,
                    name: item.name,
                    description: item.description || '',
                    price: Number(item.price),
                    image: item.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
                    isVeg: item.foodType === 'VEG',
                    category: cat.name,
                    isPopular: true,
                    isAvailable: item.isAvailable ?? true,
                  });
                });
              }
            });
            if (items.length > 0) setCurrentMenuItems(items);
            if (items.length > 0) {
              setCart((prev) => {
                if (prev.storeId !== selectedStore.id || prev.items.length === 0) {
                  return prev;
                }

                const byName = new Map(items.map((item) => [item.name.trim().toLowerCase(), item]));
                const reconciledItems = prev.items
                  .map((cartItem) => {
                    const currentItem = byName.get(cartItem.item.name.trim().toLowerCase());
                    return currentItem
                      ? { item: currentItem, quantity: cartItem.quantity }
                      : null;
                  })
                  .filter((item): item is CartItem => item !== null);

                return { ...prev, items: reconciledItems };
              });
            }
          }
        })
        .catch((err) => {
          console.warn('Backend menu fetch failed:', err.message);
        });
    }
  }, [selectedStore]);

  // Fetch customer orders from Backend
  const fetchMyOrders = useCallback(() => {
    if (!user) return;
    ApiClient.getMyOrders()
      .then((data: any[]) => {
        if (data && Array.isArray(data)) {
          const mapped: Order[] = data.map((o: any) => ({
            id: o.id,
            customerId: o.customerId,
            storeId: o.restaurantId,
            storeName: o.restaurant?.name || 'Restaurant',
            storeImage: o.restaurant?.imageUrl || 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=800&q=80',
            items: (o.orderItems || []).map((i: any) => ({
              id: i.id,
              name: i.itemNameSnapshot,
              price: Number(i.unitPrice),
              quantity: i.quantity,
              isVeg: true,
            })),
            subtotal: Number(o.subtotal),
            deliveryFee: Number(o.deliveryFee),
            total: Number(o.totalAmount),
            paymentMethod: o.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'UPI / Online (Upcoming)',
            customerDeliveryDetails: {
              name: user.name,
              phone: user.phone,
              address: o.deliveryAddress || user.address,
              hostelOrPg: o.hostelOrPgName || '',
              roomNumber: o.roomNumber || '',
            },
            createdAt: o.createdAt,
            status: o.status as OrderStatus,
            statusUpdatedAt: o.updatedAt,
            estimatedDeliveryMinutes: 25,
            deliveryPartner: o.deliveryPartner ? {
              name: o.deliveryPartner.user?.name || 'Delivery Partner',
              phone: o.deliveryPartner.phone || '',
              vehicle: 'Delivery Rider',
            } : undefined,
          }));
          setOrders(mapped);
          if (mapped.length > 0 && !activeOrderId) {
            setActiveOrderId(mapped[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn('Backend my-orders fetch failed:', err.message);
      });
  }, [user, activeOrderId]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  // Subscribe to real-time Socket.IO status updates for orders
  useEffect(() => {
    orders.forEach((o) => joinOrderRoom(o.id));

    const unsubscribe = subscribeToOrderUpdates(({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: status as OrderStatus, statusUpdatedAt: new Date().toISOString() } : o))
      );
      showToast(`Order status updated: ${status}`, 'info');
    });

    return () => {
      unsubscribe();
    };
  }, [orders]);

  // Sync state to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('qb_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qb_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('qb_cart', JSON.stringify(cart));
  }, [cart]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Operations
  const openAuthModal = (redirectAction?: () => void) => {
    if (redirectAction) setPendingAuthAction(() => redirectAction);
    setIsAuthOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthOpen(false);
    setPendingAuthAction(null);
  };

  const login = (phone: string, _otpCode?: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    const firebaseUid = cleanPhone.includes('9876543210') ? 'usr_student_101' : `dev_customer_${cleanPhone}`;
    ApiClient.setToken(firebaseUid);

    // Synchronously set user state so UI updates IMMEDIATELY
    const initialUser: UserProfile = {
      id: firebaseUid,
      name: cleanPhone.includes('9876543210') ? 'Rahul Sharma' : 'Student User',
      phone: phone || '+91 98765 43210',
      address: 'Boys Hostel B (Aryabhatta), Room 204',
      hostelOrPg: 'Boys Hostel B',
      roomNumber: '204',
      createdAt: new Date().toISOString(),
    };
    setUser(initialUser);
    showToast(`Welcome back, ${initialUser.name}!`, 'success');

    // Asynchronously fetch/sync server profile
    ApiClient.getProfile()
      .then((userProfile: any) => {
        if (userProfile) {
          setUser((prev) => ({
            ...prev!,
            id: userProfile.id || firebaseUid,
            name: userProfile.name || prev?.name || 'Student User',
            phone: userProfile.phone || prev?.phone || phone,
            address: userProfile.customer?.defaultAddress || prev?.address || 'Hostel B',
            hostelOrPg: userProfile.customer?.hostelOrPgName || prev?.hostelOrPg || '',
            roomNumber: userProfile.customer?.roomNumber || prev?.roomNumber || '',
          }));
        }
      })
      .catch(() => {
        ApiClient.register({
          firebaseUid,
          name: initialUser.name,
          phone: initialUser.phone,
        }).catch(() => {});
      });

    closeAuthModal();
    if (pendingAuthAction) pendingAuthAction();
    return true;
  };

  const signup = (data: { name: string; phone: string; address: string; hostelOrPg?: string; roomNumber?: string }) => {
    const cleanPhone = data.phone.replace(/\D/g, '');
    const firebaseUid = `dev_customer_${cleanPhone}`;
    ApiClient.setToken(firebaseUid);

    // Synchronously set user state so UI updates IMMEDIATELY
    const newUser: UserProfile = {
      id: firebaseUid,
      name: data.name,
      phone: data.phone,
      address: data.address,
      hostelOrPg: data.hostelOrPg || '',
      roomNumber: data.roomNumber || '',
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    showToast(`Account created for ${newUser.name}!`, 'success');

    // Register with backend in background
    ApiClient.register({
      firebaseUid,
      name: data.name,
      phone: data.phone,
      hostelOrPgName: data.hostelOrPg,
      roomNumber: data.roomNumber,
    }).catch(() => {});

    closeAuthModal();
    if (pendingAuthAction) pendingAuthAction();
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    ApiClient.request('/customers/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        hostelOrPgName: data.hostelOrPg,
        roomNumber: data.roomNumber,
      }),
    }).then(() => {
      setUser((prev) => (prev ? { ...prev, ...data } : null));
      showToast('Delivery profile updated successfully', 'success');
    });
  };

  const logout = () => {
    ApiClient.setToken(null);
    setUser(null);
    showToast('You have been logged out', 'info');
  };

  // Store & Menu Selection
  const selectStore = (store: Store | null) => {
    setSelectedStore(store);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cartStore = cart.storeId ? storesList.find((s) => s.id === cart.storeId) || null : null;

  const addToCart = (item: MenuItem): boolean => {
    if (cart.storeId && cart.storeId !== item.storeId && cart.items.length > 0) {
      const currentStore = storesList.find((s) => s.id === cart.storeId);
      const newStore = storesList.find((s) => s.id === item.storeId);
      setStoreConflictModal({
        isOpen: true,
        pendingItem: item,
        currentStoreName: currentStore?.name || 'Previous Store',
        newStoreName: newStore?.name || 'New Store',
      });
      return false;
    }

    setCart((prev) => {
      const existing = prev.items.find((i) => i.item.id === item.id);
      let updatedItems: CartItem[];
      if (existing) {
        updatedItems = prev.items.map((i) => (i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
        updatedItems = [...prev.items, { item, quantity: 1 }];
      }
      return {
        storeId: item.storeId,
        items: updatedItems,
      };
    });

    showToast(`Added "${item.name}" to cart`, 'success');
    return true;
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev.items
        .map((i) => {
          if (i.item.id === itemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];

      return {
        storeId: updated.length > 0 ? prev.storeId : null,
        items: updated,
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const updated = prev.items.filter((i) => i.item.id !== itemId);
      return {
        storeId: updated.length > 0 ? prev.storeId : null,
        items: updated,
      };
    });
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart({ storeId: null, items: [] });
    showToast('Cart cleared', 'info');
  };

  const confirmStoreSwitch = () => {
    if (!storeConflictModal?.pendingItem) return;
    const item = storeConflictModal.pendingItem;
    setCart({
      storeId: item.storeId,
      items: [{ item, quantity: 1 }],
    });
    setStoreConflictModal(null);
    showToast(`Started fresh cart with ${item.name}`, 'success');
  };

  const cancelStoreSwitch = () => {
    setStoreConflictModal(null);
  };

  // Cart Calculations
  const cartSubtotal = cart.items.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  const cartDeliveryFee = cartStore?.deliveryFee || (cart.items.length > 0 ? 30 : 0);
  const cartTotal = cart.items.length > 0 ? cartSubtotal + cartDeliveryFee : 0;
  const cartTotalCount = cart.items.reduce((acc, curr) => acc + curr.quantity, 0);

  const openCheckout = () => {
    if (!user) {
      openAuthModal(() => setIsCheckoutOpen(true));
      showToast('Please log in before placing an order', 'warning');
      return;
    }
    if (cart.items.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
  };

  // Place Order API Call
  const placeOrder = async (
    details: CustomerDeliveryDetails,
    paymentMethod: 'Cash on Delivery' | 'UPI / Online (Upcoming)' = 'Cash on Delivery'
  ): Promise<Order | null> => {
    if (!user) {
      openAuthModal();
      return null;
    }
    if (cart.items.length === 0 || !cartStore) {
      showToast('Cart is empty', 'error');
      return null;
    }

    setIsPlacingOrder(true);

    try {
      const createdOrder: any = await ApiClient.createOrder({
        restaurantId: cartStore.id,
        deliveryAddress: details.address,
        hostelOrPgName: details.hostelOrPg,
        roomNumber: details.roomNumber,
        paymentMethod: paymentMethod === 'Cash on Delivery' ? 'CASH_ON_DELIVERY' : 'ONLINE',
        items: cart.items.map((i) => ({ menuItemId: i.item.id, quantity: i.quantity })),
      });

      const orderId = createdOrder?.id || `FC-${Date.now().toString().slice(-6)}`;
      const orderStatus = (createdOrder?.status as OrderStatus) || 'WAITING_FOR_MANAGER';

      const newOrder: Order = {
        id: orderId,
        customerId: user.id,
        storeId: cartStore.id,
        storeName: cartStore.name,
        storeImage: cartStore.image,
        items: cart.items.map((ci) => ({
          id: ci.item.id,
          name: ci.item.name,
          price: ci.item.price,
          quantity: ci.quantity,
          isVeg: ci.item.isVeg,
        })),
        subtotal: cartSubtotal,
        deliveryFee: cartDeliveryFee,
        total: cartTotal,
        paymentMethod,
        customerDeliveryDetails: details,
        createdAt: createdOrder?.createdAt || new Date().toISOString(),
        status: orderStatus,
        statusUpdatedAt: new Date().toISOString(),
        estimatedDeliveryMinutes: 30,
      };

      setOrders((prev) => [newOrder, ...prev]);
      setCart({ storeId: null, items: [] });
      setIsPlacingOrder(false);
      setIsCheckoutOpen(false);
      setActiveOrderId(newOrder.id);
      setOrderSuccessModal(newOrder);

      // Join real-time room for order
      joinOrderRoom(newOrder.id);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      return newOrder;
    } catch (err: any) {
      setIsPlacingOrder(false);
      showToast(err?.message || 'Unable to place order. Please refresh the menu and try again.', 'error');
      return null;
    }
  };

  const closeOrderSuccessModal = () => {
    setOrderSuccessModal(null);
  };

  const cancelOrder = (orderId: string, reason = 'Cancelled by customer') => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED', rejectionReason: reason } : o))
    );
    showToast(`Order #${orderId} was cancelled`, 'info');
  };

  const simulateBackendStatusChange = (orderId: string, status: OrderStatus, reason?: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, rejectionReason: reason } : o))
    );
  };

  const activeOrder = activeOrderId ? orders.find((o) => o.id === activeOrderId) || null : null;

  const navigateToTracking = (orderId: string) => {
    setActiveOrderId(orderId);
    setCurrentTab('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthOpen,
        openAuthModal,
        closeAuthModal,
        login,
        signup,
        updateProfile,
        logout,

        stores: storesList,
        menuItems: currentMenuItems,
        selectedStore,
        selectStore,
        searchQuery,
        setSearchQuery,
        selectedCuisine,
        setSelectedCuisine,
        vegOnlyFilter,
        setVegOnlyFilter,

        cart,
        cartStore,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartDeliveryFee,
        cartTotal,
        cartTotalCount,

        storeConflictModal,
        confirmStoreSwitch,
        cancelStoreSwitch,

        isCheckoutOpen,
        openCheckout,
        closeCheckout,
        placeOrder,
        isPlacingOrder,

        orders,
        activeOrderId,
        setActiveOrderId,
        activeOrder,
        cancelOrder,
        simulateBackendStatusChange,
        isAutoSimulationActive,
        setIsAutoSimulationActive,

        orderSuccessModal,
        closeOrderSuccessModal,

        currentTab,
        setCurrentTab,
        navigateToTracking,

        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
