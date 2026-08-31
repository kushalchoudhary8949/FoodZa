import React from 'react';
import {
  ShoppingBag,
  Store,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Order, PartnerProfile } from '../types';

interface DeliveriesViewProps {
  activeOrder: Order | null;
  partner: PartnerProfile;
  onSelectOrder: (orderId: string) => void;
  onGoToCurrentDelivery: () => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({
  activeOrder,
  partner,
  onGoToCurrentDelivery,
}) => {
  return (
    <div id="deliveries-view" className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Active Deliveries</h2>
          <p className="text-xs text-slate-400 mt-1">
            Live fulfillment queue and active delivery route
          </p>
        </div>
        {activeOrder && (
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold font-mono">
            1 Active Order
          </span>
        )}
      </div>

      {/* Active Order Card */}
      {activeOrder ? (
        <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-amber-500/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-base font-black font-mono text-white">
                Order #{activeOrder.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {activeOrder.status}
              </span>
            </div>

            <div className="text-right">
              <span className="text-base font-mono font-black text-emerald-400">
                ₹{activeOrder.deliveryEarnings} Earnings
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Store */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative pl-4 border-l-4 border-l-amber-500 space-y-1">
              <div className="font-bold text-amber-400 uppercase text-[11px] flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                <span>Restaurant: {activeOrder.store.name}</span>
              </div>
              <p className="text-slate-300 pl-5">{activeOrder.store.address}</p>
            </div>

            {/* Customer */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative pl-4 border-l-4 border-l-emerald-500 space-y-1">
              <div className="font-bold text-emerald-400 uppercase text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Customer: {activeOrder.customer.name}</span>
              </div>
              <p className="text-slate-300 pl-5">{activeOrder.customer.address} ({activeOrder.customer.roomOrFloor})</p>
            </div>
          </div>

          <button
            type="button"
            id="btn-open-active-delivery-flow"
            onClick={onGoToCurrentDelivery}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>OPEN ORDER FULFILLMENT STEPS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
          <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Active Delivery Task</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {partner.isOnline
              ? 'You are currently online. The algorithm will dispatch incoming orders to you automatically.'
              : 'You are currently offline. Turn Online on the dashboard to receive delivery assignments.'}
          </p>
        </div>
      )}
    </div>
  );
};

