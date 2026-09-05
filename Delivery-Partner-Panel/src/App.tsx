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
  const [incomingRequest, setIncomingRequest] = useState<Order | null>(null);
  const [availableOrdersCount, setAvailableOrdersCount] = useState<number>(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Initial Auth Check & Dashboard Fetch
  const refreshDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setPartner(data.partner);
      const isStillActive = data.activeOrder && data.activeOrder.status !== 'DELIVERED' && !data.activeOrder.paymentReceived;
      setActiveOrder(isStillActive ? data.activeOrder : null);
      setIncomingRequest(data.incomingRequest);
      setAvailableOrdersCount(data.availableOrdersCount);
    } catch {
      // Token might be invalid or expired
      setPartner(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Periodic polling for incoming delivery requests when partner is Online
  useEffect(() => {
    if (!partner || !partner.isOnline) return;

    const interval = setInterval(() => {
      // Only check if we don't already have an incoming alert modal open
      if (!incomingRequest) {
        api.getDashboard().then((data) => {
          setPartner(data.partner);
          const isStillActive = data.activeOrder && data.activeOrder.status !== 'DELIVERED' && !data.activeOrder.paymentReceived;
          setActiveOrder(isStillActive ? data.activeOrder : null);
          setIncomingRequest(data.incomingRequest);
          setAvailableOrdersCount(data.availableOrdersCount);
        }).catch(() => {});
      }
    }, 8000); // Reduced frequency since we now have Socket.IO push

    return () => clearInterval(interval);
  }, [partner, incomingRequest]);

  // Socket.IO: Real-time delivery request push notifications
  useEffect(() => {
    if (!partner) return;

    const partnerId = api.getToken() || partner.id;
    joinPartnerRoom(partnerId);

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
      refreshDashboard();
    });

    const unsubUpdates = subscribeToOrderUpdates((data: any) => {
      console.log('[Socket.IO] Order update received on delivery panel:', data);
      if (
        (data.status === 'READY_FOR_PICKUP' || data.status === 'WAITING_FOR_PARTNER') &&
        data.payload
      ) {
        soundManager.playNewOrderAlert();
        try {
          const mapped = api.mapOrder(data.payload);
          setIncomingRequest(mapped);
          setAvailableOrdersCount((prev) => Math.max(prev, 1));
        } catch {
          setIncomingRequest(data.payload);
        }
      }
      refreshDashboard();
    });

    return () => {
      unsubRequests();
      unsubUpdates();
    };
  }, [partner, refreshDashboard]);

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
    refreshDashboard();
  };

  // Handler: Accept Incoming Delivery Request (Section 3 & 4)
  const handleAcceptDelivery = async (orderId: string) => {
    try {
      const res = await api.acceptDelivery(orderId);
      soundManager.playSuccessSound();
      setIncomingRequest(null);
      setActiveOrder(res.order);
      setActiveTab('current_delivery');
    } catch (err: any) {
      alert(err.message || 'Failed to accept delivery');
      refreshDashboard();
    }
  };

  // Handler: Reject Incoming Delivery Request (Section 3)
  const handleRejectDelivery = async (orderId: string, reason?: string) => {
    try {
      await api.rejectDelivery(orderId, reason);
      setIncomingRequest(null);
      refreshDashboard();
    } catch (err: any) {
      console.error(err);
      setIncomingRequest(null);
    }
  };

  // Handler: Order Updated during fulfillment
  const handleOrderUpdated = (updatedOrder: Order) => {
    setActiveOrder(updatedOrder);
  };

  // Handler: Delivery Completed (Section 10)
  const handleDeliveryCompleted = (completedOrder: Order, updatedPartner: PartnerProfile) => {
    setActiveOrder(null);
    setPartner(updatedPartner);
  };

  // Trigger manual simulation dispatch
  const handleSimulateOrder = async () => {
    try {
      const res = await api.dispatchNewOrder();
      if (res && res.order) {
        setIncomingRequest(res.order);
        setAvailableOrdersCount(1);
        soundManager.playNewOrderAlert();
      }
      refreshDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch test order');
    }
  };

  // Trigger demo reset
  const handleResetDemo = async () => {
    try {
      await api.resetSimulator();
      refreshDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo');
    }
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
        activeOrder={activeOrder}
        onSelectTab={setActiveTab}
        onToggleOnline={handleToggleOnline}
        onSimulateOrder={handleSimulateOrder}
        onResetDemo={handleResetDemo}
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
            onRefreshDashboard={refreshDashboard}
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
            partner={partner}
            onSelectOrder={() => setActiveTab('current_delivery')}
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
      {incomingRequest && partner.isOnline && !activeOrder && (
        <NewOrderAlertModal
          order={incomingRequest}
          onAccept={handleAcceptDelivery}
          onReject={handleRejectDelivery}
        />
      )}
    </div>
  );
}
