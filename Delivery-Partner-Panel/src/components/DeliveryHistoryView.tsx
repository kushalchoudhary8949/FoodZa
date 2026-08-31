import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Store,
  IndianRupee,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Package
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../lib/api';

export const DeliveryHistoryView: React.FC = () => {
  const [history, setHistory] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState<'ALL' | 'COD' | 'ONLINE'>('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await api.getDeliveryHistory();
      setHistory(res.history);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = history.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment =
      filterPayment === 'ALL' || order.paymentMethod === filterPayment;

    return matchesSearch && matchesPayment;
  });

  return (
    <div id="delivery-history-view" className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Delivery History</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record of your past fulfilled orders and payouts
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            Total Trips: <strong className="text-white">{history.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-2 relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, restaurant, or customer..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(['ALL', 'COD', 'ONLINE'] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setFilterPayment(method)}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                filterPayment === method
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* List of Deliveries */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs">Loading delivery records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
          <Package className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">No delivery records found</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterPayment('ALL');
            }}
            className="mt-2 text-xs text-amber-400 hover:underline cursor-pointer"
          >
            Clear search filters
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const dateObj = new Date(order.deliveredAt || order.createdAt);
            const formattedDate = dateObj.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const formattedTime = dateObj.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                id={`history-order-${order.id}`}
                className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden transition"
              >
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-white">
                        #{order.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Delivered
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {formattedDate} • {formattedTime}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center gap-1.5">
                      <span className="font-semibold text-white">{order.store.name}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-slate-400 truncate max-w-[200px]">{order.customer.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Order Value
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        ₹{order.orderAmount}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {order.paymentMethod === 'COD' ? `COD (₹${order.amountToCollect})` : 'Prepaid'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-emerald-400 block">
                        Payout
                      </span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        +₹{order.deliveryEarnings}
                      </span>
                    </div>

                    <div className="text-slate-500 pl-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="bg-slate-950/90 border-t border-slate-800/80 p-4 space-y-3 text-xs text-slate-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Store & Customer Details */}
                      <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                        <div className="font-semibold text-slate-200 text-[11px] flex items-center gap-1.5 text-amber-400">
                          <Store className="w-3.5 h-3.5" />
                          <span>Store: {order.store.name}</span>
                        </div>
                        <p className="text-slate-400 pl-5">{order.store.address}</p>
                        <div className="pt-2 border-t border-slate-800/80 font-semibold text-slate-200 text-[11px] flex items-center gap-1.5 text-emerald-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Customer: {order.customer.name}</span>
                        </div>
                        <p className="text-slate-400 pl-5">{order.customer.address} ({order.customer.roomOrFloor})</p>
                      </div>

                      {/* Items & PIN */}
                      <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                        <div className="font-semibold text-slate-200 text-[11px]">
                          Items ({order.items.length})
                        </div>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-[11px]">
                              <span className="text-slate-300">{item.quantity}x {item.name}</span>
                              <span className="font-mono text-slate-400">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px]">
                          <span className="text-slate-400">Security PIN:</span>
                          <span className="text-emerald-400 font-mono font-bold">Verified ({order.secretOtp})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

