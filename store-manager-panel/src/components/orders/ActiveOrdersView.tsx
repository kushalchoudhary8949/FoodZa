import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  ChefHat,
  CheckCircle2,
  Clock,
  Printer,
  Bike,
  AlertTriangle,
  Search,
  Filter,
  User,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
  PackageCheck,
  ShoppingBag
} from 'lucide-react';
import { Order } from '../../types';
import { KOTModal } from './KOTModal';

interface ActiveOrdersViewProps {
  setActiveNav: (nav: string) => void;
  onOpenIssueModal?: (orderId: string) => void;
}

export const ActiveOrdersView: React.FC<ActiveOrdersViewProps> = ({ setActiveNav, onOpenIssueModal }) => {
  const {
    currentStore,
    activeOrders,
    startPreparingOrder,
    markFoodReady,
    pendingOrderActions,
  } = useStoreManager();

  const [selectedKOTOrder, setSelectedKOTOrder] = useState<Order | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentStore) return null;

  const filteredOrders = activeOrders.filter((order) => {
    // Tab filter
    if (filterTab === 'ACCEPTED' && order.status !== 'MANAGER_ACCEPTED' && order.status !== 'ADMIN_ACCEPTED') return false;
    if (filterTab === 'PREPARING' && order.status !== 'PREPARING') return false;
    if (
      filterTab === 'READY' &&
      order.status !== 'READY_FOR_PICKUP' &&
      order.status !== 'WAITING_FOR_PARTNER' &&
      order.status !== 'DELIVERY_ASSIGNED'
    )
      return false;
    if (filterTab === 'OUT' && order.status !== 'OUT_FOR_DELIVERY' && order.status !== 'PICKED_UP') return false;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchCust = order.customer.name.toLowerCase().includes(q);
      const matchPhone = order.customer.phone.toLowerCase().includes(q);
      return matchId || matchCust || matchPhone;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Active Orders
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              {activeOrders.length} live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time kitchen management, preparation tracking, and delivery partner coordination.
          </p>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white border border-slate-200 p-2.5 rounded-2xl shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filterTab === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Active ({activeOrders.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('ACCEPTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filterTab === 'ACCEPTED'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            To Start ({activeOrders.filter((o) => o.status === 'MANAGER_ACCEPTED' || o.status === 'ADMIN_ACCEPTED').length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('PREPARING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filterTab === 'PREPARING'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Preparing ({activeOrders.filter((o) => o.status === 'PREPARING').length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('READY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filterTab === 'READY'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Food Ready ({activeOrders.filter((o) => o.status === 'READY_FOR_PICKUP' || o.status === 'WAITING_FOR_PARTNER' || o.status === 'DELIVERY_ASSIGNED').length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('OUT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filterTab === 'OUT'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Out for Delivery ({activeOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY' || o.status === 'PICKED_UP').length})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Name..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Orders Grid / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No active orders matching filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try clearing your search query' : 'Kitchen is all caught up with current orders!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredOrders.map((order) => {
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
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Card Header: Order # & Status Badge */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black font-mono text-slate-900 tracking-tight">
                          #{order.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isAccepted
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : isPreparing
                              ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse'
                              : isReady
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Order Total & Payment */}
                    <div className="text-right">
                      <div className="text-lg font-black font-mono text-emerald-600">
                        ₹{order.total}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                        {order.paymentMethod} • {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 my-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {order.customer.name}
                      </span>
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="text-amber-700 hover:underline font-mono flex items-center gap-1 text-[11px]"
                      >
                        <Phone className="w-3 h-3" />
                        {order.customer.phone}
                      </a>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{order.customer.deliveryAddress}</span>
                    </div>
                  </div>

                  {/* Ordered Items Breakdown */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Ordered Items</span>
                      <span className="text-[10px] text-slate-400">{order.items.reduce((s, i) => s + i.quantity, 0)} Total Items</span>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            <span className="font-semibold text-slate-900">
                              <span className="text-amber-700 font-bold mr-1.5">{item.quantity}×</span>
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

                  {/* Delivery Partner Status Card */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                      <span>Delivery Partner Status</span>
                      <span className="text-amber-700 font-mono font-bold">
                        {order.deliveryPartner ? order.deliveryPartner.status.replace(/_/g, ' ') : 'NOT ASSIGNED'}
                      </span>
                    </div>

                    {order.deliveryPartner ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                            <Bike className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{order.deliveryPartner.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {order.deliveryPartner.vehicleNumber} ({order.deliveryPartner.vehicleType})
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-emerald-700 block">
                            ETA ~{order.deliveryPartner.estimatedArrivalMinutes || 5} mins
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ⭐ {order.deliveryPartner.rating} rating
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic">
                        Searching for nearest available delivery rider...
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5 flex-wrap">
                  {isAccepted && (
                    <button
                      type="button"
                      onClick={() => startPreparingOrder(order.id)}
                      disabled={pendingOrderActions.has(order.id)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <ChefHat className="w-4 h-4" />
                      {pendingOrderActions.has(order.id) ? '[ UPDATING... ]' : '[ START PREPARING ]'}
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      type="button"
                      onClick={() => markFoodReady(order.id)}
                      disabled={pendingOrderActions.has(order.id)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                      {pendingOrderActions.has(order.id) ? '[ UPDATING... ]' : '[ FOOD READY ]'}
                    </button>
                  )}

                  {isReady && (
                    <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <PackageCheck className="w-4 h-4" />
                      <span>{order.status === 'DELIVERY_ASSIGNED' ? 'Rider assigned • Arriving at store' : 'Food on pickup shelf • Awaiting Rider Handover'}</span>
                    </div>
                  )}

                  {isOut && (
                    <div className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Bike className="w-4 h-4" />
                      <span>Rider has picked up package • En Route</span>
                    </div>
                  )}

                  {/* KOT Print button */}
                  <button
                    type="button"
                    onClick={() => setSelectedKOTOrder(order)}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
                    title="Print Kitchen Ticket"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>KOT</span>
                  </button>

                  {/* Report Issue to Admin */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenIssueModal) onOpenIssueModal(order.id);
                      setActiveNav('issues');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Report Issue to Admin"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Issue</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KOT Modal */}
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
