import React from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Clock,
  History,
  UtensilsCrossed,
  Store as StoreIcon,
  TrendingUp,
  MessageSquareWarning,
  Bell,
  User,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onOpenProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeNav, setActiveNav, onOpenProfile }) => {
  const {
    activeOrders,
    issues,
    unreadNotificationCount,
    logout,
    currentStore,
    currentManager,
  } = useStoreManager();

  const openIssuesCount = issues.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-orange-500/20">
            <StoreIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">
              Store Panel
            </div>
            <div className="text-[10px] text-amber-600 font-semibold tracking-wider uppercase">
              Kitchen Operations
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-1">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </button>

          {/* Orders Section Header */}
          <div className="pt-3 pb-1 px-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Orders
          </div>

          {/* Active Orders */}
          <button
            type="button"
            onClick={() => setActiveNav('active-orders')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'active-orders'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              <span>Active Orders</span>
            </div>
            {activeOrders.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeNav === 'active-orders'
                    ? 'bg-slate-950 text-amber-400'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                }`}
              >
                {activeOrders.length}
              </span>
            )}
          </button>

          {/* Order History */}
          <button
            type="button"
            onClick={() => setActiveNav('order-history')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'order-history'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <History className="w-4 h-4" />
              <span>Order History</span>
            </div>
          </button>

          {/* Store & Menu Management */}
          <div className="pt-3 pb-1 px-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Store Ops
          </div>

          {/* Menu Management */}
          <button
            type="button"
            onClick={() => setActiveNav('menu')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Menu Management</span>
            </div>
          </button>

          {/* Manage Store */}
          <button
            type="button"
            onClick={() => setActiveNav('manage-store')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'manage-store'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <StoreIcon className="w-4 h-4" />
              <span>Manage Store</span>
            </div>
          </button>

          {/* Sales & Analytics */}
          <button
            type="button"
            onClick={() => setActiveNav('sales')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'sales'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4" />
              <span>Sales & Analytics</span>
            </div>
          </button>

          {/* Support & Alerts */}
          <div className="pt-3 pb-1 px-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Support & Alerts
          </div>

          {/* Issue Box */}
          <button
            type="button"
            onClick={() => setActiveNav('issues')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'issues'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquareWarning className="w-4 h-4" />
              <span>Issue Box</span>
            </div>
            {openIssuesCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeNav === 'issues'
                    ? 'bg-slate-950 text-amber-400'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {openIssuesCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => setActiveNav('notifications')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'notifications'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </div>
            {unreadNotificationCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeNav === 'notifications'
                    ? 'bg-slate-950 text-amber-400'
                    : 'bg-red-500 text-white'
                }`}
              >
                {unreadNotificationCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Bottom Profile / Logout Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold cursor-pointer transition-colors"
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Profile & Security</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {currentStore && (
          <div className="mt-3 pt-2 border-t border-slate-200/80 px-2 flex items-center gap-2 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Store: {currentStore.id}</span>
          </div>
        )}
      </div>
    </aside>
  );
};
