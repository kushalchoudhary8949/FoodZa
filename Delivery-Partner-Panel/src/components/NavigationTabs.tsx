import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Navigation,
  History,
  IndianRupee,
  User
} from 'lucide-react';
import { ActiveTab, Order } from '../types';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  activeOrder: Order | null;
  onSelectTab: (tab: ActiveTab) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  activeOrder,
  onSelectTab,
}) => {
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deliveries' as const, label: 'Deliveries', icon: ShoppingBag },
    {
      id: 'current_delivery' as const,
      label: 'Active Order',
      icon: Navigation,
      hasActiveBadge: !!activeOrder,
    },
    { id: 'history' as const, label: 'Trips History', icon: History },
    { id: 'earnings' as const, label: 'Earnings', icon: IndianRupee },
    { id: 'profile' as const, label: 'Rider Profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Navigation Tabs */}
      <div className="hidden md:block border-b border-slate-800/80 bg-[#090d16]/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-2 py-2" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative px-4 py-2 rounded-xl inline-flex items-center gap-2 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-amber-400/10 text-amber-400 font-bold border border-amber-400/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.hasActiveBadge && (
                    <span className="flex h-2 w-2 relative ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-800/80 px-3 py-2">
        <div className="grid grid-cols-6 gap-1 text-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`mobile-tab-${tab.id}`}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition relative ${
                  isActive ? 'text-amber-400 font-bold bg-amber-400/10' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {tab.hasActiveBadge && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-1 truncate max-w-[52px]">
                  {tab.id === 'current_delivery' ? 'Active' : tab.id === 'history' ? 'History' : tab.id === 'profile' ? 'Profile' : tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

