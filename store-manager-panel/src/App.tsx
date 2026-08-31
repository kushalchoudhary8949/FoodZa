import React, { useState } from 'react';
import { StoreManagerProvider, useStoreManager } from './context/StoreManagerContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { NewOrderModal } from './components/orders/NewOrderModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { ActiveOrdersView } from './components/orders/ActiveOrdersView';
import { OrderHistoryView } from './components/orders/OrderHistoryView';
import { MenuManagementView } from './components/menu/MenuManagementView';
import { ManageStoreView } from './components/store/ManageStoreView';
import { SalesView } from './components/sales/SalesView';
import { IssueBoxView } from './components/issues/IssueBoxView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { ProfileModal } from './components/profile/ProfileModal';

const StoreManagerPanel: React.FC = () => {
  const { isAuthenticated, incomingOrder } = useStoreManager();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [initialIssueOrderId, setInitialIssueOrderId] = useState<string | undefined>(undefined);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleOpenIssueForOrder = (orderId: string) => {
    setInitialIssueOrderId(orderId);
    setActiveNav('issues');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased selection:bg-amber-400 selection:text-slate-900">
      {/* Top Header */}
      <Header
        activeNav={activeNav}
        setActiveNav={(nav) => setActiveNav(nav)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Body with Left Sidebar & Center Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <Sidebar
            activeNav={activeNav}
            setActiveNav={(nav) => setActiveNav(nav)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        </div>

        {/* Center Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {activeNav === 'dashboard' && <DashboardView setActiveNav={setActiveNav} />}
            {activeNav === 'active-orders' && (
              <ActiveOrdersView
                setActiveNav={setActiveNav}
                onOpenIssueModal={handleOpenIssueForOrder}
              />
            )}
            {activeNav === 'order-history' && <OrderHistoryView />}
            {activeNav === 'menu' && <MenuManagementView />}
            {activeNav === 'manage-store' && <ManageStoreView />}
            {activeNav === 'sales' && <SalesView />}
            {activeNav === 'issues' && (
              <IssueBoxView initialOrderId={initialIssueOrderId} />
            )}
            {activeNav === 'notifications' && (
              <NotificationsView setActiveNav={setActiveNav} />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Home, Orders, Menu, Sales, More) */}
      <MobileBottomNav
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Prominent Real-Time Incoming Order Popup Modal */}
      {incomingOrder && <NewOrderModal />}

      {/* Profile & Security Modal */}
      {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <StoreManagerProvider>
      <StoreManagerPanel />
    </StoreManagerProvider>
  );
}
