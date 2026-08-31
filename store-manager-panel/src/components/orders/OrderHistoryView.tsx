import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  Search,
  Calendar,
  Filter,
  Download,
  Eye,
  FileText,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Building,
  CreditCard,
  Printer,
  ChevronDown
} from 'lucide-react';
import { Order, OrderStatus, PaymentMethod } from '../../types';
import { KOTModal } from './KOTModal';

export const OrderHistoryView: React.FC = () => {
  const { orders, currentStore } = useStoreManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printKOTOrder, setPrintKOTOrder] = useState<Order | null>(null);

  if (!currentStore) return null;

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchName = order.customer.name.toLowerCase().includes(q);
      const matchPhone = order.customer.phone.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      if (order.status !== statusFilter) return false;
    }

    // Payment filter
    if (paymentFilter !== 'ALL') {
      if (order.paymentMethod !== paymentFilter) return false;
    }

    return true;
  });

  const exportCSV = () => {
    const headers = [
      'Order ID',
      'Date Time',
      'Customer Name',
      'Customer Phone',
      'Delivery Address',
      'Hostel/PG',
      'Room No',
      'Items',
      'Subtotal',
      'Delivery Fee',
      'Total',
      'Payment Method',
      'Payment Status',
      'Status',
      'Delivery Partner'
    ];

    const rows = filteredOrders.map((o) => [
      o.id,
      o.createdAt,
      `"${o.customer.name}"`,
      `"${o.customer.phone}"`,
      `"${o.customer.deliveryAddress.replace(/"/g, '""')}"`,
      `"${o.customer.hostelOrPg || ''}"`,
      `"${o.customer.roomNumber || ''}"`,
      `"${o.items.map((i) => `${i.quantity}x ${i.name}`).join('; ')}"`,
      o.subtotal,
      o.deliveryFee,
      o.total,
      o.paymentMethod,
      o.paymentStatus,
      o.status,
      `"${o.deliveryPartner?.name || 'Unassigned'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_history_${currentStore.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Order History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete records of past and processed orders for {currentStore.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-600" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Name, Phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Date Presets */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Date: All Time</option>
              <option value="TODAY">Date: Today</option>
              <option value="YESTERDAY">Date: Yesterday</option>
              <option value="WEEK">Date: Last 7 Days</option>
              <option value="MONTH">Date: This Month</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY_FOR_PICKUP">Ready For Pickup</option>
              <option value="ORDER_CANCELLED">Cancelled / Rejected</option>
              <option value="MANAGER_TIMEOUT">Manager Timeout</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Payment: All Methods</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
              <option value="NET_BANKING">Net Banking</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing {filteredOrders.length} of {orders.length} total orders</span>
          {(searchQuery || statusFilter !== 'ALL' || paymentFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setPaymentFilter('ALL');
                setDateFilter('ALL');
              }}
              className="text-amber-700 font-medium hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Address / Room</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No orders match your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isDelivered = order.status === 'DELIVERED';
                  const isCancelled = order.status === 'ORDER_CANCELLED' || order.status === 'MANAGER_REJECTED';
                  const isTimeout = order.status === 'MANAGER_TIMEOUT';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      {/* Order ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{order.id}
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{order.customer.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{order.customer.phone}</div>
                      </td>

                      {/* Address */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-700 truncate" title={order.customer.deliveryAddress}>
                          {order.customer.hostelOrPg || order.customer.deliveryAddress}
                        </div>
                        {order.customer.roomNumber && (
                          <div className="text-[10px] text-amber-700 font-mono font-medium">
                            Room: {order.customer.roomNumber}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-700 text-[11px] truncate">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} items
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 whitespace-nowrap">
                        ₹{order.total}
                        <div className="text-[10px] text-slate-500 font-normal">
                          Sub: ₹{order.subtotal} + ₹{order.deliveryFee}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{order.paymentMethod}</div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.paymentStatus === 'REFUNDED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isCancelled
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : isTimeout
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isDelivered && <CheckCircle2 className="w-3 h-3" />}
                          {isCancelled && <XCircle className="w-3 h-3" />}
                          {isTimeout && <AlertOctagon className="w-3 h-3" />}
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 mr-1 cursor-pointer border border-slate-200"
                          title="View Full Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintKOTOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer border border-slate-200"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-mono">
                  Order Details #{selectedOrder.id}
                </h3>
                <span className="text-xs text-slate-500">
                  Created {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer & Location */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                Customer & Delivery Location
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-800">
                <div><strong>Name:</strong> {selectedOrder.customer.name}</div>
                <div><strong>Phone:</strong> {selectedOrder.customer.phone}</div>
                <div className="col-span-2"><strong>Address:</strong> {selectedOrder.customer.deliveryAddress}</div>
                {selectedOrder.customer.hostelOrPg && (
                  <div><strong>Hostel/PG:</strong> {selectedOrder.customer.hostelOrPg}</div>
                )}
                {selectedOrder.customer.roomNumber && (
                  <div><strong>Room #:</strong> {selectedOrder.customer.roomNumber}</div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Ordered Items
              </div>
              <div className="space-y-1.5">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-900 font-medium">
                      <strong className="text-amber-700">{item.quantity}×</strong> {item.name}
                    </span>
                    <span className="font-mono text-slate-700 font-semibold">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery & Packaging Fee:</span>
                <span>₹{selectedOrder.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-emerald-600 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span>₹{selectedOrder.total} ({selectedOrder.paymentMethod} • {selectedOrder.paymentStatus})</span>
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="space-y-2">
              <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Status Transition Timeline
              </div>
              <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                {selectedOrder.statusHistory.map((step, idx) => (
                  <div key={idx} className="relative pl-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-amber-500 absolute -left-[17px] top-1" />
                    <div className="font-bold text-slate-900">{step.status.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-slate-500">{step.timestamp} {step.note && `• ${step.note}`}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KOT Receipt Print */}
      {printKOTOrder && (
        <KOTModal
          order={printKOTOrder}
          storeName={currentStore.name}
          onClose={() => setPrintKOTOrder(null)}
        />
      )}
    </div>
  );
};
