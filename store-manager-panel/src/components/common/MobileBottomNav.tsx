import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  Home,
  ShoppingBag,
  UtensilsCrossed,
  TrendingUp,
  MoreHorizontal,
  Store as StoreIcon,
  MessageSquareWarning,
  Bell,
  User,
  LogOut,
  X,
  History,
  Volume2,
  VolumeX,
  ChevronRight
} from 'lucide-react';

interface MobileBottomNavProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onOpenProfile: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeNav,
  setActiveNav,
  onOpenProfile,
}) => {
  const {
    activeOrders,
    unreadNotificationCount,
    issues,
    currentStore,
    toggleStoreStatus,
    isSoundMuted,
    toggleSoundMute,
    logout,
  } = useStoreManager();

  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const openIssuesCount = issues.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    setIsMoreDrawerOpen(false);
  };

  return (
    <>
      {/* Fixed Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeNav === 'dashboard'
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* 2. Orders */}
        <button
          type="button"
          onClick={() => handleNavClick('active-orders')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl relative transition-all cursor-pointer ${
            activeNav === 'active-orders' || activeNav === 'order-history'
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {activeOrders.length > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {activeOrders.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Orders</span>
        </button>

        {/* 3. Menu */}
        <button
          type="button"
          onClick={() => handleNavClick('menu')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeNav === 'menu'
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>

        {/* 4. Sales */}
        <button
          type="button"
          onClick={() => handleNavClick('sales')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeNav === 'sales'
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Sales</span>
        </button>

        {/* 5. More */}
        <button
          type="button"
          onClick={() => setIsMoreDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl relative transition-all cursor-pointer ${
            isMoreDrawerOpen ||
            ['manage-store', 'issues', 'notifications'].includes(activeNav)
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            {(unreadNotificationCount > 0 || openIssuesCount > 0) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </nav>

      {/* "More" Bottom Sheet Drawer for Mobile */}
      {isMoreDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border-t border-slate-200 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
                  <StoreIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{currentStore?.name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">More Actions & Management</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreDrawerOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  toggleStoreStatus();
                  setIsMoreDrawerOpen(false);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-colors ${
                  currentStore?.isOpen
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-slate-500">Store Status</span>
                <span className="text-xs font-black mt-1">
                  {currentStore?.isOpen ? '🟢 Open for Delivery' : '⚫ Store is Closed'}
                </span>
              </button>

            </div>

            {/* More Menu Items */}
            <div className="space-y-1.5 pt-2">
              <button
                type="button"
                onClick={() => handleNavClick('manage-store')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer ${
                  activeNav === 'manage-store'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <StoreIcon className="w-4 h-4 text-slate-600" />
                  <span>Store Profile & Operating Hours</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('order-history')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer ${
                  activeNav === 'order-history'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-slate-600" />
                  <span>Order History & Search</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('issues')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer ${
                  activeNav === 'issues'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquareWarning className="w-4 h-4 text-slate-600" />
                  <span>Issue Box (Admin Support)</span>
                </div>
                {openIssuesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {openIssuesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('notifications')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer ${
                  activeNav === 'notifications'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-600" />
                  <span>Notifications Feed</span>
                </div>
                {unreadNotificationCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreDrawerOpen(false);
                  onOpenProfile();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold bg-slate-50 text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>Manager Profile & Password</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Logout button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsMoreDrawerOpen(false);
                  logout();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-2 border border-red-200 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out from Store Panel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
