import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  ShoppingBag,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Utensils,
  ChevronRight,
  Flame,
  ChefHat,
  Bike,
  Printer,
  Sparkles,
  ShieldCheck,
  Radio,
  Plus
} from 'lucide-react';
import { Order } from '../../types';
import { KOTModal } from '../orders/KOTModal';

interface DashboardViewProps {
  setActiveNav: (nav: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveNav }) => {
  const {
    currentStore,
    currentManager,
    stats,
    activeOrders,
    orders,
    startPreparingOrder,
    markFoodReady,
    pendingOrderActions,
    toggleStoreStatus,
  } = useStoreManager();

  const [selectedKOTOrder, setSelectedKOTOrder] = useState<Order | null>(null);

  if (!currentStore || !currentManager) return null;

  return (
    <div className="space-y-6">
      {/* 1. Hero Store Header & Status Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs shrink-0">
              <img src={currentStore.logo} alt={currentStore.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {currentStore.name}
                </h1>
                {/* Store status pill */}
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                    currentStore.isOpen
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${currentStore.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {currentStore.isOpen ? '🟢 Open' : '⚫ Closed'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>Manager: <strong className="text-slate-800">{currentManager.name}</strong> ({currentManager.id})</span>
                <span className="text-slate-300">•</span>
                <span>{currentStore.locationArea}, {currentStore.city}</span>
                <span className="text-slate-300">•</span>
                <span>Hours: {currentStore.openingTime} - {currentStore.closingTime}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={toggleStoreStatus}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentStore.isOpen
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-sm'
              }`}
            >
              {currentStore.isOpen ? 'Toggle Close Store' : 'Open Store Now'}
            </button>

          </div>
        </div>

        {/* Closed Store Alert Banner if store is closed */}
        {!currentStore.isOpen && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Store is currently CLOSED.</strong> Online customers cannot place orders. Switch status to OPEN to start accepting delivery orders.
              </span>
            </div>
            <button
              onClick={toggleStoreStatus}
              className="underline font-bold hover:text-amber-700 cursor-pointer text-xs"
            >
              Open Store
            </button>
          </div>
        )}
      </div>

      {/* 2. Key Metrics Grid (Prompt Section 2 Exact Specs) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Metric 1: New Orders */}
        <div
          onClick={() => setActiveNav('active-orders')}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:border-amber-400 ${
            stats.newOrdersCount > 0
              ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/30'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">New Orders</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {stats.newOrdersCount}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            {stats.newOrdersCount > 0 ? 'Action required!' : 'Queue cleared'}
          </div>
        </div>

        {/* Metric 2: Active Orders */}
        <div
          onClick={() => setActiveNav('active-orders')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Orders</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {stats.activeOrdersCount}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            In kitchen prep / pickup
          </div>
        </div>

        {/* Metric 3: Today's Orders */}
        <div
          onClick={() => setActiveNav('order-history')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Orders</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {stats.todayOrdersCount}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">
            Received today
          </div>
        </div>

        {/* Metric 4: Today's Sales */}
        <div
          onClick={() => setActiveNav('sales')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Sales</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            ₹{stats.todaySales.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Platform revenue
          </div>
        </div>

        {/* Metric 5: Total Completed Orders */}
        <div
          onClick={() => setActiveNav('order-history')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {stats.totalCompletedOrders}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            Delivered successfully
          </div>
        </div>

        {/* Metric 6: Pending Orders */}
        <div
          onClick={() => setActiveNav('active-orders')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Orders</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {stats.pendingOrdersCount}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Kitchen queue active
          </div>
        </div>
      </div>

      {/* 3. Live Active Orders Quick Management Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Live Kitchen & Pickup Queue ({activeOrders.length})
            </h2>
          </div>
          <button
            onClick={() => setActiveNav('active-orders')}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Full Active Orders Board</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {activeOrders.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
            <ChefHat className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No active orders in kitchen right now</p>
            <p className="text-xs text-slate-500 mt-0.5">
              New customer orders will automatically trigger sound & alert popup.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.slice(0, 3).map((order) => {
              const isAccepted = order.status === 'MANAGER_ACCEPTED' || order.status === 'ADMIN_ACCEPTED';
              const isPreparing = order.status === 'PREPARING';
              const isReady =
                order.status === 'READY_FOR_PICKUP' ||
                order.status === 'WAITING_FOR_PARTNER' ||
                order.status === 'DELIVERY_ASSIGNED';
              const isOut = order.status === 'OUT_FOR_DELIVERY' || order.status === 'PICKED_UP';

              return (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors shadow-xs"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="font-mono font-black text-sm text-slate-900">#{order.id}</span>
                        <div className="text-[11px] text-slate-500">{order.customer.name}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-emerald-600">₹{order.total}</span>
                        <span className="text-[10px] block text-slate-500">{order.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="pt-2 flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          isAccepted
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : isPreparing
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : isReady
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {order.status.replace(/_/g, ' ')}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedKOTOrder(order)}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 text-xs flex items-center gap-1 cursor-pointer"
                        title="Print Kitchen Ticket"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="text-[10px]">KOT</span>
                      </button>
                    </div>

                    {/* Items snippet */}
                    <div className="pt-2 text-xs text-slate-700 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span>
                            <strong className="text-amber-600">{item.quantity}×</strong> {item.name}
                          </span>
                          <span className="font-mono text-slate-500">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Partner Status */}
                    {order.deliveryPartner && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-center gap-2">
                        <Bike className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold text-slate-900">{order.deliveryPartner.name}</span>
                          <span className="text-slate-500 text-[10px] block">
                            {order.deliveryPartner.vehicleNumber} • ETA {order.deliveryPartner.estimatedArrivalMinutes}m
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contextual Action Button */}
                  <div className="pt-2 border-t border-slate-100">
                    {isAccepted && (
                      <button
                        type="button"
                        onClick={() => startPreparingOrder(order.id)}
                        disabled={pendingOrderActions.has(order.id)}
                        className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        {pendingOrderActions.has(order.id) ? '[ UPDATING... ]' : '[ START PREPARING ]'}
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        type="button"
                        onClick={() => markFoodReady(order.id)}
                        disabled={pendingOrderActions.has(order.id)}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {pendingOrderActions.has(order.id) ? '[ UPDATING... ]' : '[ FOOD READY ]'}
                      </button>
                    )}

                    {isReady && (
                      <div className="text-center py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                        ✓ Food ready on counter • {order.status === 'DELIVERY_ASSIGNED' ? 'Rider assigned, arriving for pickup' : 'Waiting for partner pickup'}
                      </div>
                    )}

                    {isOut && (
                      <div className="text-center py-1.5 px-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-semibold">
                        🚴 Out for Delivery with {order.deliveryPartner?.name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Two-Column Operations Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Menu Overview */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Today's Sales Performance</h3>
              <p className="text-xs text-slate-500">Real-time revenue metrics derived from platform database</p>
            </div>
            <button
              onClick={() => setActiveNav('sales')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Detailed Analytics</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Simple Visual Breakdown */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block">Avg Order Value</span>
              <span className="text-lg font-black font-mono text-slate-900">₹{stats.averageOrderValue}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Weekly Revenue</span>
              <span className="text-lg font-black font-mono text-amber-600">
                ₹{Math.round(stats.weeklySales).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Monthly Revenue</span>
              <span className="text-lg font-black font-mono text-emerald-600">
                ₹{Math.round(stats.monthlySales).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="pt-1">
            <div className="text-xs font-semibold text-slate-700 mb-2">Order Fulfillment Rate</div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex border border-slate-200">
              <div className="bg-emerald-500 h-full" style={{ width: '92%' }} title="Completed (92%)" />
              <div className="bg-amber-500 h-full" style={{ width: '5%' }} title="Active (5%)" />
              <div className="bg-red-500 h-full" style={{ width: '3%' }} title="Cancelled/Rejected (3%)" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span className="text-emerald-600 font-semibold">92% Fulfilled</span>
              <span className="text-amber-600 font-semibold">5% In-Progress</span>
              <span className="text-red-600 font-semibold">3% Cancelled</span>
            </div>
          </div>
        </div>

        {/* Store Security & Isolation Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Store Access Isolation</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your account is securely bound to <strong>{currentStore.name}</strong>. Menu edits, incoming orders, customer details, and sales are isolated strictly for this store.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Store ID:</span>
                <span className="font-mono text-slate-800 font-bold">{currentStore.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Commission Rate:</span>
                <span className="font-mono text-amber-700 font-bold">{currentStore.commissionPercentage}% (Admin Set)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GSTIN:</span>
                <span className="font-mono text-slate-700">{currentStore.gstin}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveNav('manage-store')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <span>Manage Store Profile</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* KOT Modal if selected */}
      {selectedKOTOrder && (
        <KOTModal
          order={selectedKOTOrder}
          storeName={currentStore.name}
          onClose={() => setSelectedKOTOrder(null)}
        />
      )}
    </div>
  );
};
