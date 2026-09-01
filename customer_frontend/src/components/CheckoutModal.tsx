import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerDeliveryDetails } from '../types';
import { X, MapPin, Building2, DoorClosed, Phone, User, CheckCircle2, CreditCard, Banknote, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    closeCheckout,
    user,
    cart,
    cartStore,
    cartSubtotal,
    cartDeliveryFee,
    cartTotal,
    placeOrder,
    isPlacingOrder,
  } = useApp();

  const [deliveryDetails, setDeliveryDetails] = useState<CustomerDeliveryDetails>({
    name: user?.name || 'Rahul Sharma',
    phone: user?.phone || '+91 98765 43210',
    address: user?.address || 'Boys Hostel B (Aryabhatta), Room 204',
    hostelOrPg: user?.hostelOrPg || 'Boys Hostel B',
    roomNumber: user?.roomNumber || '204',
    notes: '',
  });

  // Sync state whenever user object updates
  useEffect(() => {
    if (user) {
      setDeliveryDetails({
        name: user.name || 'Rahul Sharma',
        phone: user.phone || '+91 98765 43210',
        address: user.address || 'Boys Hostel B (Aryabhatta), Room 204',
        hostelOrPg: user.hostelOrPg || 'Boys Hostel B',
        roomNumber: user.roomNumber || '204',
        notes: '',
      });
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'UPI / Online (Upcoming)'>('Cash on Delivery');

  if (!isCheckoutOpen || !user || !cartStore) return null;

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDetails: CustomerDeliveryDetails = {
      name: deliveryDetails.name || user?.name || 'Rahul Sharma',
      phone: deliveryDetails.phone || user?.phone || '+91 98765 43210',
      address: deliveryDetails.address || user?.address || 'Boys Hostel B, Campus',
      hostelOrPg: deliveryDetails.hostelOrPg || user?.hostelOrPg || 'Boys Hostel B',
      roomNumber: deliveryDetails.roomNumber || user?.roomNumber || '204',
      notes: deliveryDetails.notes || '',
    };
    await placeOrder(finalDetails, paymentMethod);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 relative my-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
                Review & Place Order
              </h2>
              <p className="text-xs text-stone-500">Ordering from <strong className="text-stone-800">{cartStore.name}</strong></p>
            </div>
            <button
              onClick={closeCheckout}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handlePlaceOrderSubmit} className="space-y-5 pt-4">
            
            {/* 1. Customer Delivery Details */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  1. Delivery Details
                </span>
                <span className="text-[11px] text-stone-400">Campus address</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Customer Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={deliveryDetails.name}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, name: e.target.value })}
                      required
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={deliveryDetails.phone}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })}
                      required
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Street / Campus Address</label>
                <input
                  type="text"
                  value={deliveryDetails.address}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                  required
                  placeholder="e.g. North Campus, Block C Gate"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Hostel / PG Name</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={deliveryDetails.hostelOrPg || ''}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, hostelOrPg: e.target.value })}
                      placeholder="e.g. Hostel B"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Room Number</label>
                  <div className="relative">
                    <DoorClosed className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={deliveryDetails.roomNumber || ''}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, roomNumber: e.target.value })}
                      placeholder="e.g. 312"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Order Items Review */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
                2. Order Items ({cart.items.reduce((acc, curr) => acc + curr.quantity, 0)})
              </div>
              <div className="divide-y divide-stone-200 max-h-36 overflow-y-auto pr-1">
                {cart.items.map((ci) => (
                  <div key={ci.item.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{ci.item.name}</span>
                      <span className="text-stone-400">× {ci.quantity}</span>
                    </div>
                    <span className="font-extrabold text-stone-900">₹{ci.item.price * ci.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Payment Method Selection */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
                3. Payment Method
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cash on Delivery Option */}
                <label
                  onClick={() => setPaymentMethod('Cash on Delivery')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-stone-900">Cash on Delivery</div>
                    <div className="text-[10px] text-stone-500">Pay when food arrives</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'Cash on Delivery' ? 'border-amber-600 bg-amber-600' : 'border-stone-300'}`}>
                    {paymentMethod === 'Cash on Delivery' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </label>

                {/* Online Payment / UPI (Extensible) */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/70 opacity-80 cursor-not-allowed"
                  title="Online payments coming soon in next release"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-stone-600 flex items-center gap-1">
                      <span>UPI / Cards</span>
                      <span className="text-[9px] font-extrabold bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded-xs">Soon</span>
                    </div>
                    <div className="text-[10px] text-stone-400">GPay, PhonePe, Cards</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Bill Breakdown */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-bold text-stone-900">₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Fee</span>
                <span className="font-bold text-stone-900">₹{cartDeliveryFee}</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-extrabold text-stone-900">
                <span>Total Amount</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={isPlacingOrder}
              className="w-full py-4 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-400 text-white font-extrabold text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Your Order...</span>
                </>
              ) : (
                <>
                  <span>CONFIRM & PLACE ORDER (₹{cartTotal})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
