import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Clock, ArrowRight, Sparkles, MapPin, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OrderSuccessModal: React.FC = () => {
  const { orderSuccessModal, closeOrderSuccessModal, navigateToTracking } = useApp();

  if (!orderSuccessModal) return null;

  const handleTrackClick = () => {
    const id = orderSuccessModal.id;
    closeOrderSuccessModal();
    navigateToTracking(id);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-stone-200"
        >
          {/* Animated checkmark icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
            <CheckCircle2 className="w-9 h-9 animate-bounce" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block mb-2">
            Order Confirmation
          </span>

          <h2 className="text-2xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
            Order placed successfully.
          </h2>

          {/* Order ID Pill */}
          <div className="my-4 py-2 px-4 rounded-xl bg-stone-100 border border-stone-200 inline-flex items-center gap-2">
            <span className="text-xs text-stone-500 font-semibold">Order ID:</span>
            <span className="text-base font-extrabold text-stone-900 font-mono">
              #{orderSuccessModal.id}
            </span>
          </div>

          {/* Waiting message as specifically required */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 mb-6 text-left flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Waiting for restaurant confirmation...
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {orderSuccessModal.storeName} will review and accept your order within 60 seconds.
              </p>
            </div>
          </div>

          {/* Quick Details */}
          <div className="text-xs text-stone-600 space-y-1 mb-6 text-left border-t border-stone-100 pt-3">
            <div className="flex justify-between">
              <span className="text-stone-400">Total Amount:</span>
              <span className="font-bold text-stone-900">₹{orderSuccessModal.total} (COD)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Delivery to:</span>
              <span className="font-semibold text-stone-800 truncate max-w-[200px]">
                {orderSuccessModal.customerDeliveryDetails.hostelOrPg || orderSuccessModal.customerDeliveryDetails.address}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <button
              onClick={handleTrackClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>TRACK LIVE ORDER</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={closeOrderSuccessModal}
              className="w-full py-2.5 px-4 rounded-xl text-stone-600 hover:bg-stone-50 text-xs font-semibold transition-colors"
            >
              Back to Campus Stores
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
