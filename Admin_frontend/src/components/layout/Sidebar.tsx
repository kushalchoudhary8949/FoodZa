import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useIntervention } from '../../context/InterventionContext';
import {
  LayoutDashboard,
  ShoppingBag,
  History,
  Store,
  UtensilsCrossed,
  Users,
  Bike,
  Bell,
  Tag,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { db } from '../../services/storage';

export type NavTab =
  | 'dashboard'
  | 'orders'
  | 'order-history'
  | 'stores'
  | 'menu'
  | 'managers'
  | 'partners'
  | 'notifications'
  | 'offers'
  | 'banners'
  | 'sales'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { admin, logout } = useAuth();
  const { pendingInterventions } = useIntervention();

  const orders = db.getOrders();
  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled'
  ).length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="w-5 h-5" />,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'order-history',
      label: 'Order History',
      icon: <History className="w-5 h-5" />,
    },
    {
      id: 'stores',
      label: 'Stores',
      icon: <Store className="w-5 h-5" />,
    },
    {
      id: 'menu',
      label: 'Menu Management',
      icon: <UtensilsCrossed className="w-5 h-5" />,
    },
    {
      id: 'managers',
      label: 'Store Owners',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'partners',
      label: 'Delivery Partners',
      icon: <Bike className="w-5 h-5" />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: 'offers',
      label: 'Offers & Promos',
      icon: <Tag className="w-5 h-5" />,
    },
    {
      id: 'banners',
      label: 'Banners & Ads',
      icon: <Tag className="w-5 h-5" />,
    },
    {
      id: 'sales',
      label: 'Sales Analytics',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          id="mobile-nav-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Element */}
      <aside
        id="admin-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-600/30 shrink-0 font-black">
              <Flame className="w-5 h-5 fill-white text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
                  FoodFleet
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                    ADMIN
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">MVP Operations</span>
              </div>
            )}
          </div>

          <button
            id="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Pending Intervention Alert Pill (if any) */}
        {pendingInterventions.length > 0 && !isCollapsed && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-xs animate-pulse">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {pendingInterventions.length} Timeout Order{pendingInterventions.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => handleNavClick('orders')}
              className="text-[11px] font-bold text-rose-400 underline hover:text-rose-200"
            >
              Resolve
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          item.badgeColor || 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Admin User Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-amber-500/20">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{admin?.name || 'Administrator'}</p>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-500 inline" />
                  {admin?.adminId || 'ADMIN100'}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                id="sidebar-logout-btn"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
