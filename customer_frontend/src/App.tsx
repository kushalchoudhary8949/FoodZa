import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { StoreList } from './components/StoreList';
import { StoreMenu } from './components/StoreMenu';
import { CartView } from './components/CartView';
import { OrdersListView } from './components/OrdersListView';
import { ProfileView } from './components/ProfileView';
import { AuthModal } from './components/AuthModal';
import { SwitchStoreModal } from './components/SwitchStoreModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ToastContainer } from './components/Toast';

const MainLayout: React.FC = () => {
  const { currentTab, selectedStore } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'home' && (
          selectedStore ? <StoreMenu store={selectedStore} /> : <StoreList />
        )}

        {currentTab === 'orders' && <OrdersListView />}

        {currentTab === 'cart' && <CartView />}

        {currentTab === 'profile' && <ProfileView />}
      </main>

      {/* Bottom Mobile Navigation */}
      <BottomNav />

      {/* Global Application Modals */}
      <AuthModal />
      <SwitchStoreModal />
      <CheckoutModal />
      <OrderSuccessModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
