import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Store, IndianRupee, Clock, ArrowRight, X } from 'lucide-react';
import { Order } from '../types';
import { soundManager } from '../lib/audio';

interface NewOrderAlertModalProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string, reason?: string) => void;
}

export const NewOrderAlertModal: React.FC<NewOrderAlertModalProps> = ({ order, onAccept, onReject }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(45);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('Distance too far');

  // Play incoming alert audio when mounted
  useEffect(() => {
    soundManager.playNewOrderAlert();
    const interval = setInterval(() => {
      soundManager.playNewOrderAlert();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject(order.id, 'Timeout - No response');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [order.id, onReject]);

  const percentLeft = (secondsRemaining / 45) * 100;

  return (
    <AnimatePresence>
      <div
        id="new-delivery-alert-overlay"
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          id="new-delivery-alert-card"
          className="w-full max-w-md bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl shadow-amber-500/20 overflow-hidden text-slate-100 relative"
        >
          {/* Top Progress bar */}
          <div className="w-full bg-slate-800 h-2">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                secondsRemaining < 15 ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]' : 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_10px_#f59e0b]'
              }`}
              style={{ width: `${percentLeft}%` }}
            />
          </div>

          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-b from-amber-500/15 to-transparent border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-xs font-black tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
                  🚨 NEW DELIVERY REQUEST
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{secondsRemaining}s</span>
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                Order #{order.id}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Trip Earnings
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  ₹{order.deliveryEarnings}
                </span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 space-y-3.5">
            {/* PICKUP */}
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3.5 relative pl-4 border-l-4 border-l-amber-500">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
                <Store className="w-3.5 h-3.5" />
                <span>RESTAURANT PICKUP</span>
              </div>
              <div className="text-sm font-bold text-white">{order.store.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{order.store.address}</div>
            </div>

            {/* DELIVERY */}
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3.5 relative pl-4 border-l-4 border-l-emerald-500">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>CUSTOMER DELIVERY</span>
              </div>
              <div className="text-sm font-bold text-white">{order.customer.address}</div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">{order.customer.roomOrFloor} • {order.customer.name}</div>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Distance</div>
                <div className="font-bold text-slate-200 mt-0.5">{order.distanceKm} km</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Items</div>
                <div className="font-bold text-slate-200 mt-0.5">{order.items.reduce((a, b) => a + b.quantity, 0)} Items</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Payment</div>
                <div className={`font-bold mt-0.5 ${order.paymentMethod === 'COD' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {order.paymentMethod === 'COD' ? `COD ₹${order.orderAmount}` : 'PAID ONLINE'}
                </div>
              </div>
            </div>

            {/* Reject reason drawer if user clicked reject */}
            {isRejecting ? (
              <div className="p-3.5 bg-slate-950 border border-rose-500/30 rounded-xl space-y-3">
                <div className="text-xs text-rose-400 font-bold flex items-center justify-between">
                  <span>Select Rejection Reason:</span>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-medium"
                >
                  <option value="Distance too far">Distance too far</option>
                  <option value="Heavy traffic in area">Heavy traffic in area</option>
                  <option value="Vehicle breakdown / low battery">Vehicle breakdown / low fuel</option>
                  <option value="Taking a break / shift ending">Taking a break / shift ending</option>
                </select>
                <button
                  type="button"
                  id="btn-confirm-reject"
                  onClick={() => onReject(order.id, rejectReason)}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            ) : (
              /* Buttons [ ACCEPT ] [ REJECT ] */
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  id="btn-reject-delivery"
                  onClick={() => setIsRejecting(true)}
                  className="py-3.5 px-4 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-700/50 border border-slate-700 text-slate-300 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>PASS / REJECT</span>
                </button>

                <button
                  type="button"
                  id="btn-accept-delivery"
                  onClick={() => onAccept(order.id)}
                  className="py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>ACCEPT DELIVERY</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

