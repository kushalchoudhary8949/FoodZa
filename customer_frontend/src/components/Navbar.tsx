import React from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, User, MapPin, Search, ChevronDown, Clock, Sparkles, UtensilsCrossed } from 'lucide-react';
import { getFriendlyStatus } from '../utils/statusUtils';

export const Navbar: React.FC = () => {
  const {
    user,
    openAuthModal,
    cartTotalCount,
    cartTotal,
    currentTab,
    setCurrentTab,
    activeOrder,
    navigateToTracking,
    selectedStore,
    selectStore,
  } = useApp();

  const friendlyActiveStatus = activeOrder ? getFriendlyStatus(activeOrder.status) : null;
  const isOrderActiveAndNotDone = activeOrder && !friendlyActiveStatus?.isCompleted;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Campus location */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                selectStore(null);
                setCurrentTab('home');
              }}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-stone-900 font-['Outfit',sans-serif] block leading-none">
                  Quick<span className="text-amber-600">Bite</span>
                </span>
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mt-0.5">
                  Campus Food Delivery
                </span>
              </div>
            </button>

            {/* Delivery address chip */}
            <div className="hidden md:flex items-center gap-1.5 pl-4 border-l border-stone-200 text-xs text-stone-600">
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="max-w-[200px] truncate">
                {user ? (
                  <span className="font-semibold text-stone-800">
                    {user.hostelOrPg ? `${user.hostelOrPg} • Rm ${user.roomNumber || ''}` : user.address}
                  </span>
                ) : (
                  <span className="text-stone-400">Hostel Delivery Available</span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Live Order Banner (if active) */}
          {isOrderActiveAndNotDone && (
            <button
              onClick={() => navigateToTracking(activeOrder.id)}
              className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-xs animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Order #{activeOrder.id}:</span>
              <span className="font-bold text-amber-800">{friendlyActiveStatus?.badgeText}</span>
              <span className="text-[11px] text-amber-600 underline ml-1">Track Live →</span>
            </button>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Orders Nav Button (Desktop) */}
            <button
              onClick={() => setCurrentTab('orders')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                currentTab === 'orders'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>My Orders</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setCurrentTab('cart')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative ${
                cartTotalCount > 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartTotalCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-stone-900 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartTotalCount}
                  </span>
                )}
              </div>
              <span className="hidden xs:inline">
                {cartTotalCount > 0 ? `₹${cartTotal}` : 'Cart'}
              </span>
            </button>

            {/* Profile / Auth Button */}
            {user ? (
              <button
                onClick={() => setCurrentTab('profile')}
                className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                  currentTab === 'profile'
                    ? 'border-amber-400 bg-amber-50 text-amber-900'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
