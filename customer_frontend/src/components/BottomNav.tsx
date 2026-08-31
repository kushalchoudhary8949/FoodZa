import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Clock, ShoppingBag, User } from 'lucide-react';
import { NavigationTab } from '../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, cartTotalCount, selectStore, activeOrder } = useApp();

  const handleTabClick = (tab: NavigationTab) => {
    if (tab === 'home') {
      // Return to store list or top
      selectStore(null);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number | boolean }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    {
      id: 'orders',
      label: 'Orders',
      icon: <Clock className="w-5 h-5" />,
      badge: activeOrder && activeOrder.status !== 'DELIVERED' && activeOrder.status !== 'CANCELLED',
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: <ShoppingBag className="w-5 h-5" />,
      badge: cartTotalCount > 0 ? cartTotalCount : undefined,
    },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-amber-600 font-bold' : 'text-stone-500 hover:text-stone-900 font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
                {typeof item.badge === 'boolean' && item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
