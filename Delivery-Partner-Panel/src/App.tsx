import React, { useEffect, useState, useCallback } from 'react';
import { api } from './lib/api';
import { soundManager } from './lib/audio';
import { joinPartnerRoom, subscribeToDeliveryRequests, subscribeToOrderUpdates } from './lib/socket';
import { ActiveTab, Order, PartnerProfile } from './types';
import { LoginModal } from './components/LoginModal';
import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
import { DashboardView } from './components/DashboardView';
import { CurrentDeliveryView } from './components/CurrentDeliveryView';
import { DeliveriesView } from './components/DeliveriesView';
import { DeliveryHistoryView } from './components/DeliveryHistoryView';
import { EarningsView } from './components/EarningsView';
import { ProfileView } from './components/ProfileView';
import { NewOrderAlertModal } from './components/NewOrderAlertModal';

export default function App() {
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<Order | null>(null);
  const [availableOrdersCount, setAvailableOrdersCount] = useState<number>(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAcceptingDelivery, setIsAcceptingDelivery] = useState(false);

  // Initial Auth Check & Dashboard Fetch
  const refreshDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setPartner(data.partner);
      const activeList = (data.activeOrders || []).filter((o) => o.status !== 'DELIVERED');
      setActiveOrders(activeList);
      setActiveOrder((prev) => {
        if (prev) {
          const updatedPrev = activeList.find((o) => o.id === prev.id);
          if (updatedPrev) return updatedPrev;
        }
        return activeList[0] || (data.activeOrder && data.activeOrder.status !== 'DELIVERED' ? data.activeOrder : null);
      });
      setIncomingRequest(data.incomingRequest);
      setAvailableOrdersCount(data.availableOrdersCount);
    } catch (error) {
      console.error('Failed to refresh delivery partner dashboard:', error);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  // Periodic polling for incoming delivery requests when partner is Online
  useEffect(() => {
    if (!partner?.isOnline) return;

    const interval = setInterval(() => {
      void refreshDashboard();
    }, 3000);

    return () => clearInterval(interval);
  }, [partner?.isOnline, refreshDashboard]);

  // Socket.IO: Real-time delivery request push notifications
  useEffect(() => {
    if (!partner) return;

    const partnerId = partner.id;

    const unsubRequests = subscribeToDeliveryRequests((data: any) => {
      console.log('[Socket.IO] Incoming delivery request:', data);
      soundManager.playNewOrderAlert();
      if (data?.order) {
        try {
          const mapped = api.mapOrder(data.order);
          setIncomingRequest(mapped);
          setAvailableOrdersCount((prev) => Math.max(prev, 1));
        } catch {
          setIncomingRequest(data.order);
        }
      }
      void refreshDashboard();
    });

    const unsubUpdates = subscribeToOrderUpdates((data: any) => {
      console.log('[Socket.IO] Order update received on delivery panel:', data);
      void refreshDashboard();
    });

    joinPartnerRoom(partnerId);

    return () => {
      unsubRequests();
      unsubUpdates();
    };
  }, [partner?.id, refreshDashboard]);

  // Handler: Login Success
  const handleLoginSuccess = (profile: PartnerProfile) => {
    setPartner(profile);
    refreshDashboard();
  };

  // Handler: Logout
  const handleLogout = () => {
    api.setToken(null);
    setPartner(null);
    setActiveOrder(null);
    setIncomingRequest(null);
    setActiveTab('dashboard');
  };

  // Handler: Toggle Online
  const handleToggleOnline = (isOnline: boolean) => {
    if (partner) {
      setPartner({ ...partner, isOnline });
    }
  };

  // Handler: Accept Incoming Delivery Request (Section 3 & 4)
  const handleAcceptDelivery = async (orderId: string) => {
    if (isAcceptingDelivery || !incomingRequest) return;
    setIsAcceptingDelivery(true);
    try {
      const res = await api.acceptDelivery(orderId, incomingRequest);
      soundManager.playSuccessSound();
      setIncomingRequest(null);
      setActiveOrder(res.order);
      setActiveOrders((prev) => {
        const exists = prev.some((o) => o.id === res.order.id);
        return exists ? prev.map((o) => (o.id === res.order.id ? res.order : o)) : [...prev, res.order];
      });
      setActiveTab('current_delivery');
    } catch (err: any) {
      if (err.status === 409) {
        setIncomingRequest(null);
        void refreshDashboard();
        return;
      }
      alert(err.message || 'Failed to accept delivery');
      refreshDashboard();
    } finally {
      setIsAcceptingDelivery(false);
    }
  };

  // Handler: Reject Incoming Delivery Request (Section 3)
  const handleRejectDelivery = useCallback(async (orderId: string, reason?: string) => {
    try {
      await api.rejectDelivery(orderId, reason);
      setIncomingRequest(null);
      refreshDashboard();
    } catch (err: any) {
      console.error(err);
      setIncomingRequest(null);
    }
  }, [refreshDashboard]);

  // Handler: Order Updated during fulfillment
  const handleOrderUpdated = (updatedOrder: Order) => {
    setActiveOrder(updatedOrder);
    setActiveOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
  };

  // Handler: Delivery Completed (Section 10)
  const handleDeliveryCompleted = (completedOrder: Order, updatedPartner: PartnerProfile) => {
    setActiveOrders((prev) => {
      const remaining = prev.filter((o) => o.id !== completedOrder.id);
      setActiveOrder(remaining[0] || null);
      if (remaining.length === 0) {
        setActiveTab('dashboard');
      }
      return remaining;
    });
    setPartner(updatedPartner);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono">Initializing Delivery Partner Panel...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, render Login Page (Section 1)
  if (!partner) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* 1. Header Navbar */}
      <Navbar
        partner={partner}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onToggleOnline={handleToggleOnline}
      />

      {/* 2. Navigation Tabs (Desktop Header + Mobile Bottom) */}
      <NavigationTabs
        activeTab={activeTab}
        activeOrder={activeOrder}
        onSelectTab={setActiveTab}
      />

      {/* 3. Main Dynamic Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            partner={partner}
            activeOrder={activeOrder}
            incomingRequest={incomingRequest}
            availableOrdersCount={availableOrdersCount}
            onToggleOnline={handleToggleOnline}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'current_delivery' && (
          <CurrentDeliveryView
            order={activeOrder}
            partner={partner}
            onOrderUpdated={handleOrderUpdated}
            onDeliveryCompleted={handleDeliveryCompleted}
            onGoToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'deliveries' && (
          <DeliveriesView
            activeOrder={activeOrder}
            activeOrders={activeOrders}
            partner={partner}
            onSelectOrder={(orderId) => {
              const target = activeOrders.find((o) => o.id === orderId);
              if (target) setActiveOrder(target);
            }}
            onGoToCurrentDelivery={() => setActiveTab('current_delivery')}
          />
        )}

        {activeTab === 'history' && <DeliveryHistoryView />}

        {activeTab === 'earnings' && <EarningsView partner={partner} />}

        {activeTab === 'profile' && (
          <ProfileView partner={partner} onLogout={handleLogout} />
        )}
      </main>

      {/* 4. Prominent New Order Dispatch Popup (Section 3) */}
      {incomingRequest && partner.isOnline && (
        <NewOrderAlertModal
          order={incomingRequest}
          onAccept={handleAcceptDelivery}
          onReject={handleRejectDelivery}
          isAccepting={isAcceptingDelivery}
        />
      )}
    </div>
  );
}
