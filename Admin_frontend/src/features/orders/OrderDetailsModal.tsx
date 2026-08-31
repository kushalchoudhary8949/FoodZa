import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { OrderStatusBadge, VegNonVegBadge, Badge } from '../../components/common/Badge';
import { Order, OrderStatus } from '../../types';
import { orderService } from '../../services/api/orderService';
import { useToast } from '../../context/ToastContext';
import {
  User,
  Phone,
  Store as StoreIcon,
  MapPin,
  Bike,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  XCircle,
  ChefHat,
  PackageCheck,
  Send,
} from 'lucide-react';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOpenAssignPartner: (order: Order) => void;
  onSuccess: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onOpenAssignPartner,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');

  if (!order) return null;

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === order.orderStatus) return;
    setIsUpdating(true);
    try {
      await orderService.updateOrderStatus(
        order.id,
        newStatus as OrderStatus,
        `Status manually updated by Admin to ${newStatus}`
      );
      success('Order Updated', `Order #${order.id} status changed to ${newStatus}`);
      onSuccess();
      setNewStatus('');
    } catch (err: any) {
      error('Failed to update status', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsUpdating(true);
    try {
      await orderService.cancelOrder(order.id, 'Cancelled manually by Admin');
      success('Order Cancelled', `Order #${order.id} has been cancelled.`);
      onSuccess();
    } catch (err: any) {
      error('Failed to cancel order', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order #${order.id} Details`}
      subtitle={`Placed on ${order.orderDateTime} • ${order.storeName}`}
      maxWidth="3xl"
      id="order-details-modal"
    >
      <div className="space-y-6">
        {/* Status Header Banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Current Status:
            </span>
            <OrderStatusBadge status={order.orderStatus} />
          </div>

          {/* Quick Admin Actions */}
          <div className="flex items-center gap-2">
            {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenAssignPartner(order)}
                  leftIcon={<Bike className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  {order.assignedPartnerName ? 'Reassign Rider' : 'Assign Rider'}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelOrder}
                  isLoading={isUpdating}
                  leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                  className="text-xs text-rose-600 hover:bg-rose-50"
                >
                  Cancel Order
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 2 Column Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer & Delivery Address */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <User className="w-3.5 h-3.5 text-amber-600" /> Customer & Delivery Address
            </h4>

            <div>
              <span className="text-slate-500 block">Customer Name:</span>
              <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">{order.customerPhone}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="flex items-start gap-1.5 text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">
                    {order.deliveryAddress.hostelOrPgName}, Room {order.deliveryAddress.roomNumber}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {order.deliveryAddress.fullAddress}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Store & Assigned Delivery Rider */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <StoreIcon className="w-3.5 h-3.5 text-amber-600" /> Store & Delivery Partner
            </h4>

            <div>
              <span className="text-slate-500 block">Restaurant / Store:</span>
              <span className="font-bold text-slate-900 text-sm">{order.storeName}</span>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-500 block mb-1">Assigned Delivery Partner:</span>
              {order.assignedPartnerName ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-purple-700" />
                    <div>
                      <span className="font-bold text-purple-900 block">{order.assignedPartnerName}</span>
                      <span className="text-[11px] text-purple-700">{order.assignedPartnerPhone}</span>
                    </div>
                  </div>
                  <Badge variant="purple" size="sm">
                    Active Rider
                  </Badge>
                </div>
              ) : (
                <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between">
                  <span>No delivery rider assigned yet</span>
                  <button
                    onClick={() => onOpenAssignPartner(order)}
                    className="font-bold underline text-amber-900 hover:text-amber-950"
                  >
                    Assign Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ordered Items & Bill Summary */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100/70 px-4 py-2.5 text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>Ordered Items ({order.items.length})</span>
            <span>Price Breakdown</span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <VegNonVegBadge isVeg={item.isVeg} />
                  <div>
                    <span className="font-bold text-slate-900">{item.name}</span>
                    <span className="text-slate-500 text-[11px] ml-2">₹{item.price} each</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-slate-500 font-semibold">Qty: {item.quantity}</span>
                  <span className="font-bold text-slate-900 w-16 text-right">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Box */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Item Subtotal:</span>
              <span className="font-medium text-slate-900">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee:</span>
              <span className="font-medium text-slate-900">₹{order.deliveryFee}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Offer Discount:</span>
                <span>- ₹{order.discount}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-base font-extrabold text-slate-900">
              <div className="flex items-center gap-2">
                <span>Grand Total:</span>
                <Badge variant={order.paymentStatus === 'Paid' ? 'success' : 'warning'} size="sm">
                  {order.paymentMethod} • {order.paymentStatus}
                </Badge>
              </div>
              <span className="text-amber-700">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Order Step-by-Step Timeline History */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5 mb-4">
            <History className="w-4 h-4 text-amber-600" /> Order Status Timeline & Audit Trail
          </h4>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {order.timeline.map((step, idx) => (
              <div key={idx} className="relative text-xs">
                <span className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-white border-2 border-white" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{step.status}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{step.timestamp}</span>
                </div>
                {step.note && <p className="text-slate-600 mt-0.5 text-[11px]">{step.note}</p>}
                {step.actor && (
                  <span className="text-[10px] text-slate-400 font-mono">By: {step.actor}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Manual Status Override Control */}
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Manual Status Override:</span>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Change Order Status --</option>
              <option value="Waiting for Manager">Waiting for Manager</option>
              <option value="Manager Accepted">Manager Accepted</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready for Pickup">Ready for Pickup</option>
              <option value="Delivery Assigned">Delivery Assigned</option>
              <option value="Picked Up">Picked Up</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <Button
            size="sm"
            onClick={handleUpdateStatus}
            disabled={!newStatus || newStatus === order.orderStatus}
            isLoading={isUpdating}
            className="text-xs"
          >
            Apply Status
          </Button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
