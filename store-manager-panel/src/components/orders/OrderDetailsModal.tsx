import React from 'react';
import { Order } from '../../types';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  X,
  User,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  ChefHat,
  CheckCircle2,
  Bike,
  Printer,
  AlertTriangle,
  Package,
  Calendar,
  Check,
  ChevronRight
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onPrintKOT?: (order: Order) => void;
  onReportIssue?: (orderId: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onPrintKOT,
  onReportIssue,
}) => {
  const { currentStore, startPreparingOrder, markFoodReady } = useStoreManager();

  if (!order || !currentStore) return null;

  const isAccepted = order.status === 'MANAGER_ACCEPTED' || order.status === 'ADMIN_ACCEPTED';
  const isPreparing = order.status === 'PREPARING';
  const isReady =
    order.status === 'READY_FOR_PICKUP' ||
    order.status === 'WAITING_FOR_PARTNER' ||
    order.status === 'DELIVERY_ASSIGNED';
  const isOut = order.status === 'OUT_FOR_DELIVERY' || order.status === 'PICKED_UP';
  const isDelivered = order.status === 'DELIVERED';
  const isCancelled =
    order.status === 'CANCELLED' ||
    order.status === 'REJECTED' ||
    order.status === 'MANAGER_REJECTED';

  // Timeline steps
  const timelineSteps = [
    { label: 'Order Placed', statusKey: 'PENDING_MANAGER_ACCEPTANCE', time: order.createdAt },
    { label: 'Store Accepted', statusKey: 'MANAGER_ACCEPTED', time: order.acceptedAt },
    { label: 'Preparing Food', statusKey: 'PREPARING', time: order.preparingAt },
    { label: 'Food Ready', statusKey: 'READY_FOR_PICKUP', time: order.readyAt },
    { label: 'Out for Delivery', statusKey: 'OUT_FOR_DELIVERY', time: order.pickedUpAt },
    { label: 'Delivered', statusKey: 'DELIVERED', time: order.deliveredAt },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'WAITING_FOR_MANAGER':
      case 'PENDING_MANAGER_ACCEPTANCE': return 0;
      case 'MANAGER_ACCEPTED': return 1;
      case 'ADMIN_ACCEPTED': return 1;
      case 'PREPARING': return 2;
      case 'READY_FOR_PICKUP':
      case 'WAITING_FOR_PARTNER':
      case 'DELIVERY_ASSIGNED': return 3;
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY': return 4;
      case 'DELIVERED': return 5;
      default: return 3;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black font-mono text-slate-900 tracking-tight">
                  Order #{order.id}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isAccepted
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : isPreparing
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse'
                      : isReady
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : isDelivered
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : isCancelled
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentStore.name} • {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Order Status Timeline */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Order Status Timeline</span>
            </h3>

            <div className="relative flex items-center justify-between">
              {timelineSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx && !isCancelled;
                const isCurrent = idx === currentStepIdx && !isCancelled;

                return (
                  <div key={step.label} className="flex flex-col items-center flex-1 text-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-semibold ${
                        isCurrent
                          ? 'text-amber-800 font-bold'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {step.time && (
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Connecting line */}
              <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
            </div>
          </div>

          {/* Customer Details & Delivery Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-600" />
                <span>Customer Information</span>
              </h3>
              <div className="text-sm font-bold text-slate-900">{order.customer.name}</div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <a href={`tel:${order.customer.phone}`} className="text-amber-700 hover:underline font-mono font-medium">
                  {order.customer.phone}
                </a>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Customer ID: {order.customerId}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Delivery Address</span>
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {order.customer.deliveryAddress}
              </p>
              {order.customer.landmark && (
                <div className="text-[11px] text-slate-500">
                  Landmark: <span className="text-slate-700 font-medium">{order.customer.landmark}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Partner Assigned info (if available) */}
          {order.deliveryPartner && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Delivery Partner
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {order.deliveryPartner.name} ({order.deliveryPartner.phone})
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {order.deliveryPartner.vehicleType} • {order.deliveryPartner.vehicleNumber}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                  {order.deliveryPartner.status.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-emerald-700 block mt-1 font-mono font-bold">
                  ETA ~{order.deliveryPartner.estimatedArrivalMinutes || 5} min
                </span>
              </div>
            </div>
          )}

          {/* Ordered Items & Pricing Breakdown */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ordered Items & Bill Details
            </h3>

            <div className="divide-y divide-slate-200">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <span className="font-semibold text-slate-900">
                        <strong className="text-amber-700">{item.quantity} ×</strong> {item.name}
                      </span>
                      {item.customization && (
                        <div className="text-[10px] text-slate-500">
                          Addons: {item.customization}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right font-mono font-semibold text-slate-700">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Summary */}
            <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-mono">₹{order.subtotal || order.items.reduce((s, i) => s + i.price * i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Restaurant Packaging & Taxes</span>
                <span className="font-mono">₹{order.tax || 25}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Partner Fee</span>
                <span className="font-mono">₹{order.deliveryFee || 35}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="text-xl font-black font-mono text-emerald-600">₹{order.total}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payment Mode: <strong>{order.paymentMethod}</strong></span>
                </span>
                <span className="font-mono text-emerald-700 font-bold uppercase">{order.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Controls Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3 z-10 flex-wrap">
          <div className="flex items-center gap-2">
            {onPrintKOT && (
              <button
                type="button"
                onClick={() => onPrintKOT(order)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print KOT</span>
              </button>
            )}

            {onReportIssue && (
              <button
                type="button"
                onClick={() => onReportIssue(order.id)}
                className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 hover:border-red-300 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Report Issue</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAccepted && (
              <button
                type="button"
                onClick={() => {
                  startPreparingOrder(order.id);
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ChefHat className="w-4 h-4" />
                <span>[ START PREPARING ]</span>
              </button>
            )}

            {isPreparing && (
              <button
                type="button"
                onClick={() => {
                  markFoodReady(order.id);
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>[ FOOD READY ]</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
