import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Store, DeliveryPartner } from '../../types';
import { orderService } from '../../services/api/orderService';
import { storeService } from '../../services/api/storeService';
import { partnerService } from '../../services/api/partnerService';
import { OrderDetailsModal } from './OrderDetailsModal';
import { AssignPartnerModal } from './AssignPartnerModal';
import { OrderStatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';
import {
  History,
  Search,
  Filter,
  Eye,
  Calendar,
  IndianRupee,
  MapPin,
  Download,
  RotateCcw,
} from 'lucide-react';

export const OrderHistoryPage: React.FC = () => {
  const { success, error } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters matching specs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [selectedPartner, setSelectedPartner] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ord, st, pt] = await Promise.all([
        orderService.getOrders(),
        storeService.getStores(),
        partnerService.getPartners(),
      ]);
      setOrders(ord);
      setStores(st);
      setPartners(pt);
    } catch {
      error('Failed to load order history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleDbChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'foodfleet_orders') {
        loadData();
      }
    };
    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStore('ALL');
    setSelectedPartner('ALL');
    setSelectedStatus('ALL');
    setSelectedPaymentMethod('ALL');
    setCurrentPage(1);
  };

  // Filter logic matching specifications
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.assignedPartnerName && order.assignedPartnerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStore =
      selectedStore === 'ALL' ? true : order.storeId === selectedStore;

    const matchesPartner =
      selectedPartner === 'ALL' ? true : order.assignedPartnerId === selectedPartner;

    const matchesStatus =
      selectedStatus === 'ALL' ? true : order.orderStatus === selectedStatus;

    const matchesPayment =
      selectedPaymentMethod === 'ALL' ? true : order.paymentMethod === selectedPaymentMethod;

    return (
      matchesSearch &&
      matchesStore &&
      matchesPartner &&
      matchesStatus &&
      matchesPayment
    );
  });

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div id="order-history-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Comprehensive Order History</h2>
          <p className="text-xs text-slate-500">
            Searchable historical registry of all campus food deliveries, status logs, and transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-order-history-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Order ID, Customer Name, Phone, Store, or Delivery Partner..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Store Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Store Outlet
            </label>
            <select
              id="filter-order-store"
              value={selectedStore}
              onChange={(e) => {
                setSelectedStore(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Stores ({stores.length})</option>
              {stores.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Partner Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Delivery Partner
            </label>
            <select
              id="filter-order-partner"
              value={selectedPartner}
              onChange={(e) => {
                setSelectedPartner(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Delivery Riders</option>
              {partners.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name} ({pt.vehicleNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Order Status
            </label>
            <select
              id="filter-order-status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Delivered">Delivered</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Preparing">Preparing</option>
              <option value="Waiting for Manager">Waiting for Manager</option>
              <option value="Waiting for Admin">Waiting for Admin</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Payment Method
            </label>
            <select
              id="filter-order-payment"
              value={selectedPaymentMethod}
              onChange={(e) => {
                setSelectedPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Payment Types</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="NetBanking">NetBanking</option>
              <option value="Cash on Delivery">Cash on Delivery (COD)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders History Table */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={8} columns={7} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No Orders Found"
          description="No orders match your chosen filters. Try resetting search parameters."
          actionLabel="Reset All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Order ID & Date</th>
                  <th className="px-5 py-3.5">Customer & Phone</th>
                  <th className="px-5 py-3.5">Store Outlet</th>
                  <th className="px-5 py-3.5">Amount & Payment</th>
                  <th className="px-5 py-3.5">Rider</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">#{order.id}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{order.orderDateTime}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{order.customerName}</div>
                      <div className="text-slate-500 text-[11px]">{order.customerPhone}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {order.deliveryAddress.hostelOrPgName}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {order.storeName}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-extrabold text-slate-900 text-sm">₹{order.total}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {order.paymentMethod} •{' '}
                        <span className={order.paymentStatus === 'Paid' ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {order.assignedPartnerName ? (
                        <div className="text-purple-900 font-medium">{order.assignedPartnerName}</div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        id={`view-order-history-${order.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailsModalOpen(true);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        className="text-xs px-2.5"
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        order={selectedOrder}
        onOpenAssignPartner={(ord) => {
          setIsDetailsModalOpen(false);
          setOrderToAssign(ord);
          setIsAssignModalOpen(true);
        }}
        onSuccess={loadData}
      />

      {/* Assign Partner Modal */}
      <AssignPartnerModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        order={orderToAssign}
        onSuccess={loadData}
      />
    </div>
  );
};
