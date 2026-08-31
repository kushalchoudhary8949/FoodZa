import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getFriendlyStatus } from '../utils/statusUtils';
import { OrderTrackingView } from './OrderTrackingView';
import { Clock, ArrowRight, Store, ShoppingBag, Utensils, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export const OrdersListView: React.FC = () => {
  const { orders, navigateToTracking, activeOrderId, setActiveOrderId, setCurrentTab, selectStore, stores } = useApp();
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);

  // If a specific order is opened for tracking
  if (selectedTrackingId) {
    return <OrderTrackingView orderId={selectedTrackingId} onBack={() => setSelectedTrackingId(null)} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
            My Orders
          </h1>
          <p className="text-xs text-stone-500">Track and view history of your hostel food deliveries</p>
        </div>

        <button
          onClick={() => {
            selectStore(null);
            setCurrentTab('home');
          }}
          className="text-xs font-bold text-amber-600 hover:text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
        >
          + New Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-stone-900 text-lg">No orders placed yet</h3>
          <p className="text-stone-500 text-xs mt-1 mb-6">
            When you order food from campus stores, your active and previous orders will appear here.
          </p>
          <button
            onClick={() => {
              selectStore(null);
              setCurrentTab('home');
            }}
            className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-all"
          >
            Browse Stores & Order Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const friendly = getFriendlyStatus(order.status);
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <motion.div
                key={order.id}
                whileHover={{ y: -2 }}
                className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Store image & metadata */}
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={order.storeImage}
                    alt={order.storeName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border border-stone-100 shrink-0"
                  />

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                        #{order.id}
                      </span>
                      <span className="text-xs text-stone-400 font-medium">• {dateStr}</span>
                    </div>

                    <h3 className="text-lg font-extrabold text-stone-900 font-['Outfit',sans-serif] truncate">
                      {order.storeName}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-1">
                      {order.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-sm font-extrabold text-stone-900">
                        ₹{order.total}
                      </span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${friendly.badgeColor}`}>
                        {friendly.badgeText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                  <button
                    onClick={() => setSelectedTrackingId(order.id)}
                    className="flex-1 sm:flex-initial py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>TRACK ORDER</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
