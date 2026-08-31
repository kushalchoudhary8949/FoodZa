import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  Bell,
  Volume2,
  VolumeX,
  Power,
  Zap,
  ChevronDown,
  Building,
  User,
  LogOut,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
  setActiveNav,
}) => {
  const {
    currentStore,
    currentManager,
    availableStores,
    switchStoreForTesting,
    toggleStoreStatus,
    simulateIncomingOrder,
    unreadNotificationCount,
    notifications,
    markNotificationAsRead,
    isSoundMuted,
    toggleSoundMute,
    testSoundAlert,
    logout,
  } = useStoreManager();

  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [isNotifPopoverOpen, setIsNotifPopoverOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSimulateOrder = () => {
    const order = simulateIncomingOrder();
    if (order) {
      showToast(`⚡ Demo Order #${order.id} generated! Watch the popup.`);
    } else {
      showToast('⚠️ Cannot place order: Store is currently CLOSED.');
    }
  };

  if (!currentStore || !currentManager) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-18 right-6 z-50 bg-white border border-amber-400 text-amber-900 px-4 py-2 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left: Store Identity & Open/Closed Status */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
            className="flex items-center gap-2.5 py-1 px-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-left transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
              <img src={currentStore.logo} alt={currentStore.name} className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 tracking-tight leading-none">
                  {currentStore.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {currentStore.locationArea} • {currentStore.id}
              </span>
            </div>
          </button>

          {/* Store Switcher Dropdown (Multi-Store Verification) */}
          {isStoreMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50">
              <div className="px-2 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Switch Store Context (Manager Role)
              </div>
              <div className="space-y-1">
                {availableStores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      switchStoreForTesting(s.id);
                      setIsStoreMenuOpen(false);
                      showToast(`Switched store context to: ${s.name}`);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      s.id === currentStore.id
                        ? 'bg-amber-50 border border-amber-400/60 text-amber-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="flex-1 truncate">
                      <div className="font-semibold truncate text-slate-900">{s.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{s.locationArea}</div>
                    </div>
                    {s.isOpen ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Open" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-400" title="Closed" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Store Open / Closed Status Pill & Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleStoreStatus}
            title={currentStore.isOpen ? 'Click to Close Store' : 'Click to Open Store'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs border ${
              currentStore.isOpen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                currentStore.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{currentStore.isOpen ? '🟢 OPEN' : '⚫ CLOSED'}</span>
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simulate Order Quick Action */}
        <button
          type="button"
          onClick={handleSimulateOrder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
          title="Simulate a new incoming customer order with 60s popup"
        >
          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
          <span className="hidden md:inline">Simulate Order #FC1024</span>
          <span className="md:hidden">Order</span>
        </button>

        {/* Sound Alert Toggle */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={toggleSoundMute}
            className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
              isSoundMuted
                ? 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title={isSoundMuted ? 'Sound Alert Muted (Click to Unmute)' : 'Sound Alert Active (Click to Mute)'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifPopoverOpen(!isNotifPopoverOpen)}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Quick Notifications Popover */}
          {isNotifPopoverOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recent Notifications
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsNotifPopoverOpen(false);
                    setActiveNav('notifications');
                  }}
                  className="text-[11px] text-amber-600 hover:underline font-semibold cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.orderId) setActiveNav('active-orders');
                        if (notif.issueId) setActiveNav('issues');
                        setIsNotifPopoverOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        !notif.isRead
                          ? 'bg-amber-50/60 border-amber-200 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-0.5">
                        <span className="text-slate-900">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Manager User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer"
          >
            <img
              src={currentManager.avatar}
              alt={currentManager.name}
              className="w-7 h-7 rounded-lg object-cover"
            />
            <div className="hidden xl:block text-left pr-1">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentManager.name}
              </div>
              <div className="text-[10px] text-amber-600 font-mono font-medium">
                {currentManager.id}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="text-xs font-bold text-slate-900">{currentManager.name}</div>
                <div className="text-[11px] text-slate-500">{currentManager.email}</div>
                <div className="text-[10px] text-emerald-600 font-mono font-bold mt-0.5">Role: Store Manager</div>
              </div>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onOpenProfile();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50 cursor-pointer text-left"
              >
                <User className="w-4 h-4 text-slate-500" />
                Profile & Credentials
              </button>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  testSoundAlert();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50 cursor-pointer text-left"
              >
                <Volume2 className="w-4 h-4 text-slate-500" />
                Test Order Chime
              </button>

              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 cursor-pointer text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
