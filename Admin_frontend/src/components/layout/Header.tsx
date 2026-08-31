import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useIntervention } from '../../context/InterventionContext';
import { NavTab } from './Sidebar';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  ShieldAlert,
  ChevronDown,
  User,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { DemoTimeoutTriggerButton } from '../intervention/TimeoutAlertBanner';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileNav: () => void;
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenMobileNav, onSelectTab }) => {
  const { admin, logout } = useAuth();
  const { pendingInterventions, openInterventionModal } = useIntervention();
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Admin Dashboard';
      case 'orders':
        return 'Live Order Management';
      case 'order-history':
        return 'Order History & Tracking';
      case 'stores':
        return 'Store Management';
      case 'menu':
        return 'Menu Management';
      case 'managers':
        return 'Store Owner & Manager Management';
      case 'partners':
        return 'Delivery Partner Fleet';
      case 'notifications':
        return 'Push Notifications';
      case 'offers':
        return 'Offers, Coupons & Sales';
      case 'sales':
        return 'Sales & Revenue Analytics';
      case 'settings':
        return 'Platform Settings';
      default:
        return 'Admin Portal';
    }
  };

  return (
    <header
      id="admin-header"
      className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs"
    >
      {/* Left: Mobile Menu & Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-btn"
          onClick={onOpenMobileNav}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 id="page-heading" className="text-lg font-bold text-slate-900 leading-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Centralized operations & platform control
          </p>
        </div>
      </div>

      {/* Right: Quick simulation button, Urgent Notifications Bell & Profile dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mock Timeout Test Action */}
        <DemoTimeoutTriggerButton />

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="header-notif-bell"
            onClick={() => {
              setIsNotifDropdownOpen(!isNotifDropdownOpen);
              setIsProfileDropdownOpen(false);
            }}
            className={`p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors ${
              pendingInterventions.length > 0 ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : ''
            }`}
            title="Urgent Alerts & Notifications"
          >
            <Bell className="w-5 h-5" />
            {pendingInterventions.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white animate-ping" />
            )}
            {pendingInterventions.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white" />
            )}
          </button>

          {isNotifDropdownOpen && (
            <div
              id="notif-dropdown-menu"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Admin Action Required
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {pendingInterventions.length} Pending
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {pendingInterventions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    🎉 All stores operating smoothly. No manager timeout alerts!
                  </div>
                ) : (
                  pendingInterventions.map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 text-xs"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Order #{order.id}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{order.orderDateTime}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">
                          Manager at <span className="font-semibold">{order.storeName}</span> timed out.
                        </p>
                        <button
                          onClick={() => {
                            setIsNotifDropdownOpen(false);
                            openInterventionModal(order);
                          }}
                          className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1"
                        >
                          Resolve Now →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setIsNotifDropdownOpen(false);
                    onSelectTab('orders');
                  }}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  View All Orders
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            id="header-profile-menu-btn"
            onClick={() => {
              setIsProfileDropdownOpen(!isProfileDropdownOpen);
              setIsNotifDropdownOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-amber-500/20">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-slate-900 leading-none">{admin?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-500 leading-none mt-1">Super Admin</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          {isProfileDropdownOpen && (
            <div
              id="profile-dropdown-menu"
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{admin?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{admin?.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ID: {admin?.adminId}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    onSelectTab('settings');
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-slate-400" /> Platform Settings
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  id="profile-logout-btn"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
