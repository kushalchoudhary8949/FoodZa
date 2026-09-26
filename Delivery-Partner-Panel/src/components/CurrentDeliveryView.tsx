import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  MapPin,
  Store,
  Phone,
  Navigation,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  ShoppingBag,
  Clock,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Check,
  PackageCheck,
  ReceiptText
} from 'lucide-react';
import { Order, PartnerProfile } from '../types';
import { api } from '../lib/api';
import { soundManager } from '../lib/audio';

interface CurrentDeliveryViewProps {
  order: Order | null;
  partner: PartnerProfile;
  onOrderUpdated: (updatedOrder: Order) => void;
  onDeliveryCompleted: (completedOrder: Order, partner: PartnerProfile) => void;
  onGoToDashboard: () => void;
}

export const CurrentDeliveryView: React.FC<CurrentDeliveryViewProps> = ({
  order,
  partner,
  onOrderUpdated,
  onDeliveryCompleted,
  onGoToDashboard,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState(false);
  const [isPickingUp, setIsPickingUp] = useState(false);
  const [isStartingTransit, setIsStartingTransit] = useState(false);
  const [deliveredSuccessOrder, setDeliveredSuccessOrder] = useState<Order | null>(null);

  const [isFastTracking, setIsFastTracking] = useState(false);

  const toggleItemChecked = (itemId: string) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleQuickFillAndVerifyOtp = async () => {
    try {
      setIsVerifyingOtp(true);
      setOtpError(null);
      setOtpInput(active.secretOtp);
      const res = await api.verifyOtp(active.id, active.secretOtp);
      soundManager.playSuccessSound();
      if (res.partner && res.order.status === 'DELIVERED') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        setDeliveredSuccessOrder(res.order);
        onDeliveryCompleted(res.order, res.partner);
      } else {
        onOrderUpdated(res.order);
      }
    } catch (err: any) {
      soundManager.playErrorSound();
      setOtpError(err.message || 'Invalid delivery PIN.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Fast-track entire order flow in 1-click for testing/smooth completion
  const handleFastTrackComplete = async () => {
    try {
      setIsFastTracking(true);
      let current = active;

      // 1. Pickup if assigned
      if (current.status === 'DELIVERY_ASSIGNED') {
        const pickupRes = await api.pickupOrder(current.id);
        current = pickupRes.order;
        onOrderUpdated(current);
      }

      if (current.status === 'PICKED_UP') {
        const transitRes = await api.outForDelivery(current.id);
        current = transitRes.order;
        onOrderUpdated(current);
      }

      // 2. Verify OTP if not verified
      if (!current.otpVerified) {
        const otpRes = await api.verifyOtp(current.id, current.secretOtp);
        current = otpRes.order;
        onOrderUpdated(current);
      }

      // 3. Mark completed; payment can remain pending.
      const completeRes = await api.completeDelivery(current.id);
      soundManager.playSuccessSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setDeliveredSuccessOrder(completeRes.order);
      onDeliveryCompleted(completeRes.order, completeRes.partner);
    } catch (err: any) {
      alert(err.message || 'Failed to complete order automatically');
    } finally {
      setIsFastTracking(false);
    }
  };

  if (!order && !deliveredSuccessOrder) {
    return (
      <div id="no-active-delivery-view" className="max-w-xl mx-auto p-6 sm:p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1.5">No Active Delivery</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
          {partner.isOnline
            ? "You are currently online. Incoming delivery requests will appear on your screen automatically."
            : "You are currently offline. Switch your status to Online to start receiving delivery requests."}
        </p>
        <button
          type="button"
          id="btn-return-dashboard"
          onClick={onGoToDashboard}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Celebratory completion screen
  if (deliveredSuccessOrder || order?.status === 'DELIVERED') {
    const finalOrder = deliveredSuccessOrder || order!;
    return (
      <div id="order-delivered-success-screen" className="max-w-md mx-auto p-4 animate-in fade-in duration-300">
        <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 text-center shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="inline-block px-3.5 py-1 bg-emerald-500/15 border border-emerald-500/40 rounded-full text-xs font-black text-emerald-400 tracking-wider uppercase mb-2">
            TRIP COMPLETED
          </span>

          <h2 className="text-2xl font-black text-white font-mono tracking-tight mb-1">
            Order #{finalOrder.id}
          </h2>
          <p className="text-xs text-slate-400 mb-5 font-medium">
            Delivered to {finalOrder.customer.name}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5 text-left">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                {finalOrder.paymentReceived
                  ? finalOrder.paymentMethod === 'COD' ? 'Cash Collected' : 'Paid Online'
                  : 'Payment Pending'}
              </span>
              <span className="text-xl font-black text-white mt-0.5 block font-mono">
                ₹{finalOrder.paymentReceived
                  ? finalOrder.paymentMethod === 'COD' ? finalOrder.amountToCollect : finalOrder.orderAmount
                  : 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {finalOrder.paymentReceived
                  ? finalOrder.paymentMethod === 'COD' ? 'Cash received' : 'Payment received online'
                  : finalOrder.paymentMethod === 'COD' ? 'COD remains outstanding' : 'Payment remains outstanding'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/40">
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">
                Trip Earnings
              </span>
              <span className="text-xl font-black text-emerald-400 mt-0.5 block font-mono">
                +₹{finalOrder.deliveryEarnings}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Credited to wallet
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-2 mb-5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Pickup Store:</span>
              <span className="font-bold text-white truncate max-w-[200px]">{finalOrder.store.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Delivery Address:</span>
              <span className="font-bold text-white truncate max-w-[200px]">{finalOrder.customer.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Verified PIN:</span>
              <span className="font-mono text-emerald-400 font-bold">{finalOrder.secretOtp}</span>
            </div>
          </div>

          <button
            type="button"
            id="btn-completed-view-earnings"
            onClick={onGoToDashboard}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition cursor-pointer"
          >
            RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  const active = order!;

  const openMapNavigation = (destinationAddress: string, coords: { lat: number; lng: number }) => {
    const encoded = encodeURIComponent(destinationAddress);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}&destination_place_id=${encoded}`;
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  const makePhoneCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber.replace(/\s+/g, '')}`;
  };

  const handlePickupOrder = async () => {
    try {
      setIsPickingUp(true);
      const res = await api.pickupOrder(active.id);
      soundManager.playSuccessSound();
      onOrderUpdated(res.order);
    } catch (err: any) {
      alert(err.message || 'Failed to confirm pickup');
    } finally {
      setIsPickingUp(false);
    }
  };

  const handleStartTransit = async () => {
    try {
      setIsStartingTransit(true);
      const res = await api.outForDelivery(active.id);
      soundManager.playSuccessSound();
      onOrderUpdated(res.order);
    } catch (err: any) {
      alert(err.message || 'Failed to start delivery');
    } finally {
      setIsStartingTransit(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 4) {
      setOtpError('Please enter a 4-digit OTP');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setOtpError(null);
      const res = await api.verifyOtp(active.id, otpInput.trim());
      soundManager.playSuccessSound();
      if (res.partner && res.order.status === 'DELIVERED') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        setDeliveredSuccessOrder(res.order);
        onDeliveryCompleted(res.order, res.partner);
      } else {
        onOrderUpdated(res.order);
      }
    } catch (err: any) {
      soundManager.playErrorSound();
      setOtpError(err.message || 'Invalid delivery PIN. Please re-check with customer.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setIsConfirmingPayment(true);
      if (!isOtpVerified) {
        try {
          await api.verifyOtp(active.id, active.secretOtp);
        } catch {
          // ignore error and proceed
        }
      }
      const res = await api.confirmPayment(active.id);
      soundManager.playSuccessSound();
      onOrderUpdated(res.order);
    } catch (err: any) {
      alert(err.message || 'Failed to record cash payment');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      setIsMarkingDelivered(true);
      if (!isOtpVerified) {
        await api.verifyOtp(active.id, active.secretOtp);
      }
      const res = await api.completeDelivery(active.id);
      soundManager.playSuccessSound();
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });
      setDeliveredSuccessOrder(res.order);
      onDeliveryCompleted(res.order, res.partner);
    } catch (err: any) {
      alert(err.message || 'Failed to finish delivery');
    } finally {
      setIsMarkingDelivered(false);
    }
  };

  const isAssigned = active.status === 'DELIVERY_ASSIGNED';
  const isPickedUp = active.status === 'PICKED_UP';
  const isOutForDelivery = active.status === 'OUT_FOR_DELIVERY';
  const isOtpVerified = active.otpVerified || active.status === 'OTP_VERIFIED' || active.status === 'PAYMENT_RECEIVED';
  const isCod = active.paymentMethod === 'COD';
  const isPaymentDone = active.paymentReceived || active.status === 'PAYMENT_RECEIVED';
  const isReadyToComplete = isOtpVerified;

  return (
    <div id="current-delivery-panel" className="max-w-2xl mx-auto space-y-4 pb-14">
      {/* Top Trip Summary Header & Interactive Step Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Active Order
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-white font-mono font-bold">#{active.id}</span>
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              {isAssigned ? `Pickup: ${active.store.name}` : `Deliver: ${active.customer.name}`}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Trip Payout
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              ₹{active.deliveryEarnings}
            </span>
          </div>
        </div>

        {/* Step Progress Bar with Status Badges */}
        <div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className={`p-2.5 rounded-xl border transition ${isAssigned ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-400/10' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              <div className="text-[10px] font-black uppercase tracking-wider">1. Pickup</div>
              <div className="text-[11px] truncate mt-0.5 font-semibold">{isAssigned ? '● Current' : '✓ Done'}</div>
            </div>

            <div className={`p-2.5 rounded-xl border transition ${(isPickedUp || isOutForDelivery) && !isOtpVerified ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-400/10' : isOtpVerified ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
              <div className="text-[10px] font-black uppercase tracking-wider">2. Transit</div>
              <div className="text-[11px] truncate mt-0.5 font-semibold">{(isPickedUp || isOutForDelivery) && !isOtpVerified ? '● Current' : isOtpVerified ? '✓ Arrived' : 'Next'}</div>
            </div>

            <div className={`p-2.5 rounded-xl border transition ${isOtpVerified ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold' : isOutForDelivery ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
              <div className="text-[10px] font-black uppercase tracking-wider">3. PIN</div>
              <div className="text-[11px] truncate mt-0.5 font-semibold">{isOtpVerified ? '✓ Verified' : isOutForDelivery ? '● Required' : 'Next'}</div>
            </div>

            <div className={`p-2.5 rounded-xl border transition ${isPaymentDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold' : isOtpVerified ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
              <div className="text-[10px] font-black uppercase tracking-wider">4. Complete</div>
              <div className="text-[11px] truncate mt-0.5 font-semibold">{isPaymentDone ? '✓ Paid' : 'Payment Due'}</div>
            </div>
          </div>
        </div>

        {/* Fast-Track 1-Click Order Completer for Demo / Convenience */}
        <div className="p-3 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-left">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-white block">Need to test or finish quickly?</span>
              <span className="text-[11px] text-slate-400">Complete pickup, verify the customer PIN, and finish delivery.</span>
            </div>
          </div>
          <button
            type="button"
            id="btn-fast-track-complete"
            disabled={isFastTracking}
            onClick={handleFastTrackComplete}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
          >
            {isFastTracking ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Complete Trip</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STEP 1: STORE PICKUP */}
      {isAssigned && (
        <div id="stage-pickup-card" className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-amber-500/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-black block">
                  PICKUP LOCATION
                </span>
                <h3 className="text-lg font-black text-white">{active.store.name}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => makePhoneCall(active.store.phone)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Call Store"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Store</span>
            </button>
          </div>

          {/* Store Address & Details */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative pl-4 border-l-4 border-l-amber-500 space-y-1.5 text-xs">
            <div className="text-slate-200 font-medium flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{active.store.address}</span>
            </div>
            {active.store.landmark && (
              <div className="text-slate-400 pl-6">
                Landmark: <span className="text-slate-200 font-semibold">{active.store.landmark}</span>
              </div>
            )}
            {active.store.pickupInstructions && (
              <div className="mt-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2.5 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>{active.store.pickupInstructions}</span>
              </div>
            )}
          </div>

          {/* Navigation to Store */}
          <button
            type="button"
            id="btn-navigate-to-store"
            onClick={() => openMapNavigation(active.store.address, active.store.coordinates)}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>OPEN MAPS TO STORE</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Order Items Checklist */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider">Order Items Checklist</span>
              <span className="text-amber-400 text-[11px] font-medium">Verify items with merchant</span>
            </div>
            <div className="space-y-1.5">
              {active.items.map((item) => {
                const isChecked = !!checkedItems[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItemChecked(item.id)}
                    className={`w-full flex items-center justify-between text-xs py-2.5 px-3 rounded-xl border transition text-left cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isChecked ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'}`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className={isChecked ? 'line-through text-slate-400' : 'font-bold text-white'}>
                        {item.quantity}x {item.name}
                      </span>
                    </div>
                    <span className="font-mono text-slate-300 font-bold text-xs">₹{item.price * item.quantity}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-2 flex justify-between text-xs text-slate-400 border-t border-slate-800">
              <span>Bill Total: <strong className="text-white font-mono font-bold">₹{active.orderAmount}</strong></span>
              <span className="text-emerald-400 font-bold">{active.paymentMethod === 'COD' ? 'COD (Cash On Delivery)' : 'Paid Online'}</span>
            </div>
          </div>

          {/* Confirm Pickup Action */}
          <div className="pt-1">
            <button
              type="button"
              id="btn-order-picked-up"
              disabled={isPickingUp}
              onClick={handlePickupOrder}
              className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/25 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPickingUp ? (
                <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <PackageCheck className="w-5 h-5" />
                  <span>CONFIRM ORDER PICKED UP</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: START TRANSIT */}
      {isPickedUp && (
        <div id="stage-transit-start-card" className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-amber-500/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-black block">TRANSIT</span>
              <h3 className="text-lg font-black text-white">Ready to deliver</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400">The order is picked up. Start navigation to the customer to continue.</p>
          <button
            type="button"
            id="btn-start-transit"
            disabled={isStartingTransit}
            onClick={handleStartTransit}
            className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isStartingTransit ? (
              <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                <span>START DELIVERY / GO TO CUSTOMER</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* STEP 2: OUT FOR DELIVERY & CUSTOMER DROP */}
      {isOutForDelivery && (
        <div className="space-y-4">
          {/* Customer Location & Contact */}
          <div id="stage-customer-card" className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 shadow-2xl shadow-emerald-500/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-black block">
                    DELIVER TO CUSTOMER
                  </span>
                  <h3 className="text-lg font-black text-white">{active.customer.name}</h3>
                </div>
              </div>
              <button
                type="button"
                id="btn-call-customer"
                onClick={() => makePhoneCall(active.customer.phone)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Customer</span>
              </button>
            </div>

            {/* Address */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative pl-4 border-l-4 border-l-emerald-500 space-y-1.5 text-xs">
              <div className="text-sm font-bold text-white">{active.customer.address}</div>
              <div className="text-emerald-400 font-semibold">{active.customer.roomOrFloor}</div>
              {active.customer.deliveryInstructions && (
                <div className="text-slate-300 bg-slate-900 border border-slate-800 p-2.5 rounded-lg mt-2">
                  <span className="text-amber-400 font-bold">Delivery Note: </span>
                  {active.customer.deliveryInstructions}
                </div>
              )}
            </div>

            {/* Navigation Button */}
            <button
              type="button"
              id="btn-navigate-to-customer"
              onClick={() => openMapNavigation(active.customer.address, active.customer.coordinates)}
              className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>OPEN MAPS NAVIGATION TO CUSTOMER</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>

          {/* OTP Verification Box */}
          <div id="otp-verification-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${isOtpVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
                <h3 className="text-sm font-bold text-white">
                  {isOtpVerified ? 'Delivery PIN Verified' : 'Customer 4-Digit Delivery PIN'}
                </h3>
              </div>

              {isOtpVerified && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            {isOtpVerified ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 text-emerald-300 text-xs font-medium flex items-center justify-between">
                <span>Customer PIN validated successfully ({active.secretOtp})</span>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Ask the customer for their 4-digit delivery PIN on drop-off.
                </p>

                {/* Driver Helper badge with 1-Tap Autofill & Verify */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Customer SMS PIN:</span>
                    <span className="font-mono font-black text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded border border-amber-500/30 text-sm">
                      {active.secretOtp}
                    </span>
                  </div>
                  <button
                    type="button"
                    id="btn-quick-fill-verify-otp"
                    disabled={isVerifyingOtp}
                    onClick={handleQuickFillAndVerifyOtp}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Fill & Verify</span>
                  </button>
                </div>

                {otpError && (
                  <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-400 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <div>
                  <input
                    id="input-customer-otp"
                    type="text"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, ''));
                      setOtpError(null);
                    }}
                    placeholder="Enter 4-digit PIN"
                    className="w-full text-center text-2xl tracking-[0.5em] font-mono font-black py-3 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-amber-400 focus:outline-none transition shadow-inner"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="btn-verify-otp"
                    type="submit"
                    disabled={isVerifyingOtp || otpInput.length !== 4}
                    className="py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>VERIFY TYPED PIN</span>
                    )}
                  </button>

                  <button
                    type="button"
                    id="btn-use-otp-shortcut"
                    disabled={isVerifyingOtp}
                    onClick={handleQuickFillAndVerifyOtp}
                    className="py-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Use PIN {active.secretOtp}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Payment Handling */}
          <div id="payment-collection-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className={`w-5 h-5 ${isPaymentDone ? 'text-emerald-400' : 'text-amber-400'}`} />
                <h3 className="text-sm font-bold text-white">
                  {isCod ? 'Cash Collection' : 'Payment Status'}
                </h3>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-black ${isPaymentDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                {isCod ? (isPaymentDone ? 'Cash Collected' : 'Payment Pending') : isPaymentDone ? 'Paid Online' : 'Payment Pending'}
              </span>
            </div>

            {isCod ? (
              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Order Total:</span>
                    <span className="font-mono text-white font-bold">₹{active.orderAmount}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-300">COLLECT CASH:</span>
                    <span className="text-3xl font-black text-amber-400 font-mono">₹{active.amountToCollect}</span>
                  </div>
                </div>

                {!isPaymentDone ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      id="btn-payment-received"
                      disabled={isConfirmingPayment}
                      onClick={handleConfirmPayment}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      {isConfirmingPayment ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>CONFIRM CASH RECEIVED (₹{active.amountToCollect})</span>
                        </>
                      )}
                    </button>
                    {!isOtpVerified && (
                      <p className="text-[11px] text-slate-400 text-center font-medium">
                        * Tapping will also automatically verify customer PIN ({active.secretOtp}).
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Cash payment of ₹{active.amountToCollect} recorded.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <span className={`font-black block ${isPaymentDone ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isPaymentDone ? 'Prepaid Order (Online UPI / Card)' : 'Online payment pending'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {isPaymentDone ? 'No cash collection needed from customer' : 'Delivery can be completed; payment remains outstanding'}
                  </span>
                </div>
                <span className="font-mono font-black text-white text-base">₹{active.orderAmount}</span>
              </div>
            )}
          </div>

          {/* Complete Delivery Action */}
          <div id="complete-delivery-card" className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-xl shadow-emerald-500/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Complete Delivery</h3>
              <span className="text-xs text-emerald-400 font-mono font-black">+₹{active.deliveryEarnings} Trip Credit</span>
            </div>

            <button
              type="button"
              id="btn-mark-as-delivered"
              disabled={isMarkingDelivered}
              onClick={handleCompleteDelivery}
              className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/25 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isMarkingDelivered ? (
                <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>COMPLETE & MARK DELIVERED</span>
                </>
              )}
            </button>
            {!isReadyToComplete ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold uppercase tracking-wider">Required to finish trip:</span>
                  <span className="text-amber-400 font-semibold">Verify PIN to complete</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {!isOtpVerified && (
                    <button
                      type="button"
                      id="btn-shortcut-verify-pin"
                      onClick={handleQuickFillAndVerifyOtp}
                      className="flex-1 py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>1-Tap Verify PIN ({active.secretOtp})</span>
                    </button>
                  )}
                  {isCod && !isPaymentDone && (
                    <button
                      type="button"
                      id="btn-shortcut-confirm-cash"
                      onClick={async () => {
                        if (!isOtpVerified) {
                          await handleQuickFillAndVerifyOtp();
                        }
                        await handleConfirmPayment();
                      }}
                      className="flex-1 py-2.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Cash (₹{active.amountToCollect})</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300 font-semibold">
                ✓ PIN verified. Payment may remain pending; click above to complete delivery and credit ₹{active.deliveryEarnings} to your wallet.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
