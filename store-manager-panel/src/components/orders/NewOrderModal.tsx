import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import { Bell, Clock, Check, X, AlertTriangle, User, MapPin, Phone, ShieldAlert, Sparkles } from 'lucide-react';

export const NewOrderModal: React.FC = () => {
  const {
    incomingOrder,
    incomingOrderTimeRemaining,
    acceptOrder,
    rejectOrder,
  } = useStoreManager();

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('Kitchen overloaded / High order volume');
  const [customReason, setCustomReason] = useState('');

  if (!incomingOrder) return null;

  const totalTime = incomingOrder.timeoutSeconds || 60;
  const progressPercent = Math.max(0, Math.min(100, (incomingOrderTimeRemaining / totalTime) * 100));

  // Dynamic urgency color
  const isUrgent = incomingOrderTimeRemaining <= 15;
  const isCritical = incomingOrderTimeRemaining <= 7;

  const handleConfirmReject = () => {
    const finalReason = customReason.trim() || rejectReason;
    rejectOrder(incomingOrder.id, finalReason);
    setIsRejecting(false);
    setCustomReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Outer glow ring based on remaining time */}
      <div
        className={`relative w-full max-w-lg rounded-2xl bg-white border shadow-2xl overflow-hidden transition-all duration-300 ${
          isCritical
            ? 'border-red-500 ring-4 ring-red-500/20'
            : isUrgent
            ? 'border-amber-500 ring-2 ring-amber-500/20'
            : 'border-emerald-500/60'
        }`}
      >
        {/* Top Urgency Header Bar */}
        <div
          className={`py-3 px-6 flex items-center justify-between text-white transition-colors duration-300 ${
            isCritical
              ? 'bg-red-600'
              : isUrgent
              ? 'bg-amber-600'
              : 'bg-emerald-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-full animate-bounce">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest block text-white/90">
                Incoming Order Notification
              </span>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                🔔 NEW ORDER #{incomingOrder.id}
              </h2>
            </div>
          </div>

          {/* Real-time Timer Badge */}
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/20">
            <Clock className={`w-4 h-4 ${isCritical ? 'text-red-200 animate-spin' : 'text-white'}`} />
            <span className="font-mono font-bold text-sm text-white">
              ⏱ {incomingOrderTimeRemaining}s
            </span>
          </div>
        </div>

        {/* Linear Visual Countdown Progress Bar */}
        <div className="w-full bg-slate-100 h-2 relative overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isCritical ? 'bg-red-500' : isUrgent ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Order Details Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900">{incomingOrder.customer.name}</span>
                <span className="text-slate-400">•</span>
                <span className="font-mono text-slate-600">{incomingOrder.customer.phone}</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                {incomingOrder.paymentMethod}
              </span>
            </div>

            {/* Delivery address snippet */}
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{incomingOrder.customer.deliveryAddress}</span>
            </div>

            {/* Items List */}
            <div className="pt-2 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Ordered Items:
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {incomingOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 text-sm shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          item.isVeg ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-red-500 ring-2 ring-red-500/20'
                        }`}
                        title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      />
                      <span className="font-medium text-slate-900">
                        <strong className="text-amber-700 font-bold mr-1.5">{item.quantity} ×</strong>
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono text-slate-700 font-semibold">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Price Summary */}
            <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Total Bill Amount</span>
                <p className="text-[11px] text-slate-400">Includes delivery fee & packaging</p>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-600">
                ₹{incomingOrder.total}
              </div>
            </div>
          </div>

          {/* Timeout Warning notice */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              If no action is taken within <strong>{incomingOrderTimeRemaining}s</strong>, this order will be escalated to <strong>Admin for review</strong>.
            </span>
          </div>

          {/* Action Area */}
          {!isRejecting ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-300 text-sm font-bold cursor-pointer transition-all active:scale-[0.98]"
              >
                <X className="w-5 h-5 text-red-500" />
                [ REJECT ]
              </button>

              <button
                type="button"
                onClick={() => acceptOrder(incomingOrder.id)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-sm text-sm cursor-pointer transition-all active:scale-[0.98]"
              >
                <Check className="w-5 h-5 text-white stroke-[3]" />
                [ ACCEPT ]
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-red-900">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Select Reason for Rejecting Order #{incomingOrder.id}
                </span>
                <button
                  onClick={() => setIsRejecting(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer underline"
                >
                  Back
                </button>
              </div>

              <div className="space-y-1.5">
                {[
                  'Kitchen overloaded / High order volume',
                  'Item(s) out of stock',
                  'Store closing early / Shift hand-over',
                  'Power / Equipment malfunction',
                ].map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-red-400"
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      value={reason}
                      checked={rejectReason === reason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Or specify custom reason..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
