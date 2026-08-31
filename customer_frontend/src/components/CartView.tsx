import React from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Store, MapPin, Building2, DoorClosed, ShieldCheck, Sparkles, Utensils } from 'lucide-react';
import { motion } from 'motion/react';

export const CartView: React.FC = () => {
  const {
    cart,
    cartStore,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartDeliveryFee,
    cartTotal,
    cartTotalCount,
    openCheckout,
    selectStore,
    setCurrentTab,
    user,
    openAuthModal,
  } = useApp();

  if (cart.items.length === 0 || !cartStore) {
    return (
      <div className="py-16 text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
          Your Cart is Empty
        </h2>
        <p className="text-xs text-stone-500 mt-2 mb-6 leading-relaxed">
          Looks like you haven't added anything to your cart yet. Explore stores and add delicious hostel snacks or hot meals!
        </p>
        <button
          onClick={() => {
            selectStore(null);
            setCurrentTab('home');
          }}
          className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
        >
          <Utensils className="w-4 h-4" />
          <span>Browse Campus Stores</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
            Your Food Cart
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {cartTotalCount} {cartTotalCount === 1 ? 'item' : 'items'} from{' '}
            <strong className="text-stone-800">{cartStore.name}</strong>
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 py-1.5 px-3 rounded-xl transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Store Card Banner */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={cartStore.image}
                alt={cartStore.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border border-stone-100"
              />
              <div>
                <h3 className="font-bold text-stone-900 text-sm">{cartStore.name}</h3>
                <p className="text-xs text-stone-500">{cartStore.location}</p>
              </div>
            </div>

            <button
              onClick={() => {
                selectStore(cartStore);
                setCurrentTab('home');
              }}
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              + Add More
            </button>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs divide-y divide-stone-100">
            {cart.items.map((cartItem) => {
              const { item, quantity } = cartItem;
              return (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  
                  {/* Veg indicator & details */}
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div
                      className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 mt-0.5 shrink-0 ${
                        item.isVeg ? 'border-emerald-600' : 'border-rose-700'
                      }`}
                    >
                      {item.isVeg ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      ) : (
                        <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-rose-700" />
                      )}
                    </div>

                    <div className="truncate">
                      <h4 className="font-bold text-stone-900 text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-stone-500 font-medium">₹{item.price} each</p>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl p-1 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center transition-colors shadow-xs"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-extrabold text-stone-900">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center transition-colors shadow-xs"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0 w-16">
                    <span className="font-bold text-stone-900 text-sm">
                      ₹{item.price * quantity}
                    </span>
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                </div>
              );
            })}
          </div>

          {/* Delivery Address Summary Card */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-stone-500">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Delivery Address</span>
              </div>
              {user ? (
                <button
                  onClick={() => setCurrentTab('profile')}
                  className="text-xs font-bold text-amber-600 hover:underline"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal()}
                  className="text-xs font-bold text-amber-600 hover:underline"
                >
                  Sign In
                </button>
              )}
            </div>

            {user ? (
              <div className="text-xs text-stone-700 space-y-1">
                <p className="font-bold text-stone-900">{user.name} ({user.phone})</p>
                <p className="text-stone-600">{user.address}</p>
                {user.hostelOrPg && (
                  <div className="flex items-center gap-2 text-amber-800 font-semibold pt-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{user.hostelOrPg} {user.roomNumber ? `• Room ${user.roomNumber}` : ''}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/70 text-xs text-amber-900 flex items-center justify-between">
                <span>Please log in to confirm your delivery room/hostel</span>
                <button
                  onClick={() => openAuthModal()}
                  className="font-bold underline ml-2 shrink-0"
                >
                  Log in now
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Bill Details & CTA */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-stone-900 text-sm font-['Outfit',sans-serif] pb-2 border-b border-stone-100">
              Bill Summary
            </h3>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between text-stone-600">
                <span>Item Subtotal</span>
                <span className="font-bold text-stone-900">₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Partner Fee</span>
                <span className="font-bold text-stone-900">₹{cartDeliveryFee}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Student Campus Discount</span>
                <span className="font-bold">FREE Packaging</span>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-extrabold text-stone-900">Total to Pay</span>
                <span className="block text-[11px] text-stone-400 font-normal">Cash on Delivery</span>
              </div>
              <span className="text-xl font-extrabold text-stone-900">₹{cartTotal}</span>
            </div>

            {/* Place Order / Checkout Button */}
            <button
              onClick={openCheckout}
              className="w-full py-4 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>PLACE ORDER (₹{cartTotal})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400 text-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cash on Delivery supported for MVP</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
