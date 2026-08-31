import React, { useState } from 'react';
import {
  Power,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Star,
  MapPin,
  Store,
  ArrowRight,
  Clock,
  Radio,
  Zap,
  RotateCcw,
  CheckCircle2,
  Navigation,
  Compass,
  Sparkles,
  Award
} from 'lucide-react';
import { Order, PartnerProfile } from '../types';
import { api } from '../lib/api';

interface DashboardViewProps {
  partner: PartnerProfile;
  activeOrder: Order | null;
  incomingRequest: Order | null;
  availableOrdersCount: number;
  onToggleOnline: (isOnline: boolean) => void;
  onNavigateToTab: (tab: 'current_delivery' | 'deliveries' | 'history' | 'earnings') => void;
  onRefreshDashboard: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  partner,
  activeOrder,
  availableOrdersCount,
  onToggleOnline,
  onNavigateToTab,
  onRefreshDashboard,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  const handleToggle = async (targetState: boolean) => {
    try {
      setIsToggling(true);
      await api.toggleStatus(targetState);
      onToggleOnline(targetState);
    } catch (err: any) {
      alert(err.message || 'Failed to update duty status');
    } finally {
      setIsToggling(false);
    }
  };

  const handleSimulateNewOrder = async () => {
    if (!partner.isOnline) {
      alert('Please switch to Online status first to receive incoming orders.');
      return;
    }
    if (activeOrder) {
      alert(`You currently have active order #${activeOrder.id}. Complete it first or navigate to the Active Order tab.`);
      return;
    }
    try {
      setIsDispatching(true);
      setSimMessage(null);
      const res = await api.dispatchNewOrder();
      setSimMessage(`New delivery request #${res.order.id} sent! Review the dispatch alert.`);
      onRefreshDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch order');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setIsResetting(true);
      await api.resetSimulator();
      setSimMessage('Demo state reset. Initial sample order #FC1024 loaded.');
      onRefreshDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div id="dashboard-view" className="max-w-4xl mx-auto space-y-5 pb-14">
      {/* Driver Shift Status Card */}
      <div
        id="online-status-hero"
        className={`rounded-2xl p-5 sm:p-6 border-2 transition-all duration-300 ${
          partner.isOnline
            ? 'bg-slate-900 border-emerald-500/50 shadow-2xl shadow-emerald-500/10'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl transition ${
                partner.isOnline
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Power className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    partner.isOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]' : 'bg-slate-600'
                  }`}
                />
                <span className={`text-xs font-black uppercase tracking-wider ${partner.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {partner.isOnline ? '● YOU ARE ONLINE' : '● YOU ARE OFFLINE'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Central Hub Active</span>
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                {partner.isOnline ? 'Ready For Delivery Requests' : 'Duty Off — Rest Mode'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {partner.isOnline
                  ? 'You are active in the dispatch pool and receiving order broadcasts.'
                  : 'Switch your status to Online to start receiving incoming food deliveries.'}
              </p>
            </div>
          </div>

          {/* Toggle Action */}
          <div className="flex items-center gap-2">
            {partner.isOnline ? (
              <button
                type="button"
                id="btn-go-offline"
                disabled={isToggling}
                onClick={() => handleToggle(false)}
                className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-600/60 border border-slate-700 text-slate-300 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Power className="w-4 h-4" />
                <span>GO OFFLINE</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-go-online"
                disabled={isToggling}
                onClick={() => handleToggle(true)}
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Power className="w-4 h-4" />
                <span>GO ONLINE</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Order Highlight if one is ongoing */}
      {activeOrder && activeOrder.status !== 'DELIVERED' && activeOrder.status !== 'PAYMENT_RECEIVED' && !activeOrder.paymentReceived && (
        <div
          id="dashboard-active-order-banner"
          className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-5 shadow-2xl shadow-amber-500/15 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                </span>
                <span className="text-xs font-mono font-black uppercase tracking-wider text-amber-400">
                  ACTIVE DELIVERY IN PROGRESS
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-white font-mono font-bold">Order #{activeOrder.id}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <span className="text-amber-400">{activeOrder.store.name}</span>
                <span className="text-slate-500">➔</span>
                <span className="text-emerald-400">{activeOrder.customer.address}</span>
              </div>

              <div className="text-xs text-slate-300 flex items-center gap-3">
                <span>Status: <strong className="text-amber-400 font-bold">{activeOrder.status.replace(/_/g, ' ')}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-extrabold">Payout: ₹{activeOrder.deliveryEarnings}</span>
              </div>
            </div>

            <button
              type="button"
              id="btn-resume-active-delivery"
              onClick={() => onNavigateToTab('current_delivery')}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <span>CONTINUE TRIP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Primary Driver Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Earnings */}
        <div id="stat-today-earnings" className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Today's Earnings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ₹{partner.todayEarnings}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Updated in real-time</span>
          </div>
        </div>

        {/* Trips Completed */}
        <div id="stat-today-deliveries" className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Trips Completed</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {partner.todayDeliveries}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Completed deliveries today
          </div>
        </div>

        {/* Total Earnings */}
        <div id="stat-total-earnings" className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-4 sm:p-5 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Total Payout</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
            ₹{partner.totalEarnings.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            All-time balance credited
          </div>
        </div>

        {/* Partner Rating */}
        <div id="stat-partner-rating" className="bg-slate-900 border border-slate-800 hover:border-amber-400/40 rounded-2xl p-4 sm:p-5 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Partner Rating</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {partner.rating} ★
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Based on customer ratings
          </div>
        </div>
      </div>

      {/* Order Dispatch Simulation Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Dispatch Simulator Controls
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Test incoming assignments & notifications</span>
        </div>

        {simMessage && (
          <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{simMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            id="btn-simulate-dispatch"
            disabled={isDispatching || !partner.isOnline}
            onClick={handleSimulateNewOrder}
            className="py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{isDispatching ? 'Sending Alert...' : 'Simulate Incoming Order Alert'}</span>
          </button>

          <button
            type="button"
            id="btn-reset-demo"
            disabled={isResetting}
            onClick={handleResetDemo}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>{isResetting ? 'Resetting...' : 'Reset Demo (Load Sample Order #FC1024)'}</span>
          </button>
        </div>
      </div>

      {/* Fulfillment Step Overview */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 sm:p-5">
        <h4 className="text-xs font-semibold text-slate-400 mb-3">
          Standard Delivery Steps
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[10px] text-amber-400 font-bold uppercase">Step 1</div>
            <div className="font-semibold text-slate-200 mt-0.5">Accept Dispatch</div>
            <div className="text-[10px] text-slate-500">Review payout & route</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[10px] text-amber-400 font-bold uppercase">Step 2</div>
            <div className="font-semibold text-slate-200 mt-0.5">Pickup at Store</div>
            <div className="text-[10px] text-slate-500">Verify order package</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[10px] text-amber-400 font-bold uppercase">Step 3</div>
            <div className="font-semibold text-slate-200 mt-0.5">Drop & Verify OTP</div>
            <div className="text-[10px] text-slate-500">4-digit customer PIN</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[10px] text-emerald-400 font-bold uppercase">Step 4</div>
            <div className="font-semibold text-slate-200 mt-0.5">Payout Credited</div>
            <div className="text-[10px] text-slate-500">Direct wallet deposit</div>
          </div>
        </div>
      </div>
    </div>
  );
};

