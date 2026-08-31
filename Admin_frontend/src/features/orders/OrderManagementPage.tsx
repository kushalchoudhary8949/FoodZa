import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { orderService } from '../../services/api/orderService';
import { OrderDetailsModal } from './OrderDetailsModal';
import { AssignPartnerModal } from './AssignPartnerModal';
import { useIntervention } from '../../context/InterventionContext';
import { OrderStatusBadge, VegNonVegBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  ShoppingBag,
  Search,
  Bike,
  Clock,
  Eye,
  AlertTriangle,
  MapPin,
  Phone,
  Store as StoreIcon,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const OrderManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const { openInterventionModal } = useIntervention();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'ALL_ACTIVE' | 'PENDING' | 'PREPARING' | 'DISPATCHED' | 'TIMEOUT'
  >('ALL_ACTIVE');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch {
      error('Failed to load active orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const handleDbChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'foodfleet_orders') {
        loadOrders();
      }
    };
    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, []);

  // Filter only active / in-flight orders for live order management
  const liveOrders = orders.filter(
    (o) => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled'
  );

  const timeoutCount = liveOrders.filter(
    (o) => o.orderStatus === 'Waiting for Admin' || o.orderStatus === 'Manager Timeout' || o.isTimeoutInterventionRequired
  ).length;

  const filteredOrders = liveOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.assignedPartnerName && order.assignedPartnerName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'PENDING':
        return (
          order.orderStatus === 'Waiting for Manager' ||
          order.orderStatus === 'Waiting for Admin' ||
          order.orderStatus === 'Manager Timeout'
        );
      case 'PREPARING':
        return (
          order.orderStatus === 'Manager Accepted' ||
          order.orderStatus === 'Admin Accepted' ||
          order.orderStatus === 'Preparing' ||
          order.orderStatus === 'Ready for Pickup'
        );
      case 'DISPATCHED':
        return (
          order.orderStatus === 'Delivery Assigned' ||
          order.orderStatus === 'Picked Up' ||
          order.orderStatus === 'Out for Delivery'
        );
      case 'TIMEOUT':
        return (
          order.orderStatus === 'Waiting for Admin' ||
          order.orderStatus === 'Manager Timeout' ||
          order.isTimeoutInterventionRequired
        );
      case 'ALL_ACTIVE':
      default:
        return true;
    }
  });

  return (
    <div id="live-order-management-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Live Order Queue</h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {liveOrders.length} In-Flight
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time fulfillment tracking across store kitchens, delivery riders, and customer drop-offs
          </p>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            id="tab-all-live"
            onClick={() => setActiveTab('ALL_ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ALL_ACTIVE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Live ({liveOrders.length})
          </button>

          <button
            id="tab-pending"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Acceptance
          </button>

          <button
            id="tab-preparing"
            onClick={() => setActiveTab('PREPARING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PREPARING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Kitchen Preparing
          </button>

          <button
            id="tab-dispatched"
            onClick={() => setActiveTab('DISPATCHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'DISPATCHED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Out with Rider
          </button>

          {timeoutCount > 0 && (
            <button
              id="tab-timeout-alert"
              onClick={() => setActiveTab('TIMEOUT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'TIMEOUT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Intervention Required ({timeoutCount})
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-live-orders-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID, customer, store..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Orders List Table */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={5} columns={6} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No Active Orders"
          description="There are currently no live orders matching this status filter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Order ID & Time</th>
                  <th className="px-5 py-3.5">Customer & Hostel</th>
                  <th className="px-5 py-3.5">Store Outlet</th>
                  <th className="px-5 py-3.5">Items Ordered</th>
                  <th className="px-5 py-3.5">Delivery Rider</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isTimeout =
                    order.orderStatus === 'Waiting for Admin' ||
                    order.orderStatus === 'Manager Timeout' ||
                    order.isTimeoutInterventionRequired;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTimeout ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">#{order.id}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{order.orderDateTime}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{order.customerName}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {order.deliveryAddress.hostelOrPgName}, Room {order.deliveryAddress.roomNumber}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-900 block">{order.storeName}</span>
                        <span className="text-[11px] text-slate-400">Total: ₹{order.total}</span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-slate-700 max-w-[200px] truncate">
                          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </div>
                        <span className="text-[10px] text-slate-400">{order.items.length} items</span>
                      </td>

                      <td className="px-5 py-4">
                        {order.assignedPartnerName ? (
                          <div className="flex items-center gap-1.5 text-purple-900 font-semibold">
                            <Bike className="w-3.5 h-3.5 text-purple-600" />
                            <span>{order.assignedPartnerName}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setOrderToAssign(order);
                              setIsAssignModalOpen(true);
                            }}
                            className="text-[11px] font-bold text-amber-700 underline hover:text-amber-900"
                          >
                            + Assign Rider
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <OrderStatusBadge status={order.orderStatus} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isTimeout ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => openInterventionModal(order)}
                              className="text-xs font-bold"
                              leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                            >
                              Intervene
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsDetailsModalOpen(true);
                              }}
                              className="text-xs px-2.5"
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Details
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        order={selectedOrder}
        onOpenAssignPartner={(ord) => {
          setIsDetailsModalOpen(false);
          setOrderToAssign(ord);
          setIsAssignModalOpen(true);
        }}
        onSuccess={loadOrders}
      />

      {/* Assign Delivery Partner Modal */}
      <AssignPartnerModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        order={orderToAssign}
        onSuccess={loadOrders}
      />
    </div>
  );
};
