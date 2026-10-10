import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { InterventionProvider } from './context/InterventionContext';
import { LoginPage } from './features/auth/LoginPage';
import { Layout } from './components/layout/Layout';
import { NavTab } from './components/layout/Sidebar';

// Pages
import { DashboardPage } from './features/dashboard/DashboardPage';
import { StoreListPage } from './features/stores/StoreListPage';
import { ManagerListPage } from './features/managers/ManagerListPage';
import { PartnerListPage } from './features/partners/PartnerListPage';
import { MenuManagementPage } from './features/menu/MenuManagementPage';
import { OrderManagementPage } from './features/orders/OrderManagementPage';
import { OrderHistoryPage } from './features/orders/OrderHistoryPage';
import { NotificationPage } from './features/notifications/NotificationPage';
import { OffersPage } from './features/offers/OffersPage';
import { SalesDashboardPage } from './features/sales/SalesDashboardPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { BannerManagementPage } from './features/banners/BannerManagementPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeStoreIdForMenu, setActiveStoreIdForMenu] = useState<string | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-300">Loading FoodFleet Admin...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigateToMenu = (storeId?: string) => {
    if (storeId) {
      setActiveStoreIdForMenu(storeId);
    }
    setCurrentTab('menu');
  };

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={(tab) => setCurrentTab(tab as NavTab)}
            onManageStoreMenu={handleNavigateToMenu}
          />
        );
      case 'orders':
        return <OrderManagementPage />;
      case 'order-history':
        return <OrderHistoryPage />;
      case 'stores':
        return <StoreListPage onManageMenu={handleNavigateToMenu} />;
      case 'menu':
        return <MenuManagementPage initialStoreId={activeStoreIdForMenu} />;
      case 'managers':
        return <ManagerListPage />;
      case 'partners':
        return <PartnerListPage />;
      case 'notifications':
        return <NotificationPage />;
      case 'offers':
        return <OffersPage />;
      case 'banners':
        return <BannerManagementPage />;
      case 'sales':
        return <SalesDashboardPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            onNavigate={(tab) => setCurrentTab(tab as NavTab)}
            onManageStoreMenu={handleNavigateToMenu}
          />
        );
    }
  };

  return (
    <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {renderActivePage()}
    </Layout>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <InterventionProvider>
          <AppContent />
        </InterventionProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
