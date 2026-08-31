import React from 'react';
import { Order } from '../../types';
import { Printer, X, Check, Utensils, Clock, User, Phone, MapPin } from 'lucide-react';

interface KOTModalProps {
  order: Order;
  storeName: string;
  onClose: () => void;
}

export const KOTModal: React.FC<KOTModalProps> = ({ order, storeName, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Kitchen Order Ticket (KOT)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-6 overflow-y-auto bg-white text-black font-mono text-xs select-text">
          <div className="text-center pb-3 border-b-2 border-dashed border-black">
            <h2 className="text-lg font-black uppercase tracking-tight">{storeName}</h2>
            <div className="text-[11px] font-bold">KITCHEN ORDER TICKET</div>
            <div className="text-xs font-black mt-1">*** ORDER #{order.id} ***</div>
            <div className="text-[10px] text-gray-700 mt-0.5">
              Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Date: {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Customer / Delivery Details */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
            <div><strong>Customer:</strong> {order.customer.name}</div>
            <div><strong>Phone:</strong> {order.customer.phone}</div>
            <div><strong>Address:</strong> {order.customer.deliveryAddress}</div>
            {order.customer.hostelOrPg && (
              <div><strong>Hostel/PG:</strong> {order.customer.hostelOrPg} (Rm: {order.customer.roomNumber})</div>
            )}
            <div><strong>Payment:</strong> {order.paymentMethod} ({order.paymentStatus})</div>
          </div>

          {/* Items Checklist Table */}
          <div className="py-3 border-b-2 border-dashed border-black">
            <div className="flex justify-between font-bold pb-1 text-[11px] border-b border-gray-300">
              <span>ITEM</span>
              <span>QTY</span>
              <span>PRICE</span>
            </div>
            <div className="space-y-2 pt-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs font-bold">
                  <div className="flex-1 pr-2">
                    <span>{item.name}</span>
                    <span className="text-[10px] block font-normal text-gray-700">
                      {item.isVeg ? '[VEG]' : '[NON-VEG]'}
                    </span>
                  </div>
                  <span className="w-12 text-center text-sm font-black bg-gray-200 px-1 py-0.5 rounded">
                    x {item.quantity}
                  </span>
                  <span className="w-16 text-right">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total & Summary */}
          <div className="py-2.5 space-y-1 text-right text-xs">
            <div className="flex justify-between text-gray-700 text-[11px]">
              <span>Subtotal:</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-700 text-[11px]">
              <span>Delivery Fee:</span>
              <span>₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-gray-400">
              <span>GRAND TOTAL:</span>
              <span>₹{order.total}</span>
            </div>
          </div>

          {/* Delivery Partner Assigned Notice */}
          {order.deliveryPartner && (
            <div className="mt-2 p-2 bg-gray-100 rounded border border-gray-300 text-[10px] text-gray-800">
              <div><strong>Delivery Partner:</strong> {order.deliveryPartner.name}</div>
              <div><strong>Vehicle:</strong> {order.deliveryPartner.vehicleNumber} ({order.deliveryPartner.vehicleType})</div>
              <div><strong>Phone:</strong> {order.deliveryPartner.phone}</div>
            </div>
          )}

          <div className="text-center pt-3 border-t border-dashed border-gray-400 text-[10px] text-gray-600">
            Thank you for ordering fresh!
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print KOT Ticket
          </button>
        </div>
      </div>
    </div>
  );
};
