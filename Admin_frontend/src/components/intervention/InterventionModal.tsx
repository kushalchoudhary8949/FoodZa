import React, { useState } from 'react';
import { useIntervention } from '../../context/InterventionContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { OrderStatusBadge, VegNonVegBadge } from '../common/Badge';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Store as StoreIcon,
  Phone,
  User,
  AlertTriangle,
  Send,
  UserCheck,
} from 'lucide-react';
import { db } from '../../services/storage';

export const InterventionModal: React.FC = () => {
  const {
    isInterventionModalOpen,
    selectedInterventionOrder,
    closeInterventionModal,
    acceptOrder,
    rejectOrder,
  } = useIntervention();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionTab, setActionTab] = useState<'accept' | 'reject'>('accept');
  const [rejectReason, setRejectReason] = useState('Store capacity full / items unavailable during rush');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  if (!selectedInterventionOrder) return null;

  const partners = db.getPartners().filter((p) => p.accountStatus === 'Active');

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await acceptOrder(selectedInterventionOrder.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await rejectOrder(selectedInterventionOrder.id, rejectReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isInterventionModalOpen}
      onClose={closeInterventionModal}
      title={`Admin Intervention: Order #${selectedInterventionOrder.id}`}
      subtitle="Store manager timeout escalation - Manual resolution required"
      maxWidth="2xl"
      id="intervention-modal"
    >
      <div className="space-y-5">
        {/* Urgency Alert Callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Manager Unattended Timeout:</span> The store manager for{' '}
            <span className="font-bold underline">{selectedInterventionOrder.storeName}</span> did not respond within the SLA threshold. As Admin, you can accept the order on behalf of the store or cancel and initiate customer refund.
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer & Address */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" /> Customer & Delivery Address
            </h4>
            <div className="text-slate-900 font-semibold text-sm">
              {selectedInterventionOrder.customerName}
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Phone className="w-3.5 h-3.5" /> {selectedInterventionOrder.customerPhone}
            </div>
            <div className="pt-2 border-t border-slate-200/60 text-slate-700 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900">
                  {selectedInterventionOrder.deliveryAddress.hostelOrPgName},{' '}
                  {selectedInterventionOrder.deliveryAddress.roomNumber}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  {selectedInterventionOrder.deliveryAddress.fullAddress}
                </div>
              </div>
            </div>
          </div>

          {/* Store & Financials */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <StoreIcon className="w-3.5 h-3.5 text-slate-500" /> Store & Bill Details
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Store:</span>
              <span className="font-bold text-slate-900">{selectedInterventionOrder.storeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Payment Mode:</span>
              <span className="font-semibold text-slate-800">{selectedInterventionOrder.paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Payment Status:</span>
              <span className="font-bold text-emerald-700">{selectedInterventionOrder.paymentStatus}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between font-bold text-slate-900 text-sm">
              <span>Grand Total:</span>
              <span className="text-base text-amber-700">₹{selectedInterventionOrder.total}</span>
            </div>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100/70 px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            Items in Order ({selectedInterventionOrder.items.length})
          </div>
          <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
            {selectedInterventionOrder.items.map((item) => (
              <div key={item.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <VegNonVegBadge isVeg={item.isVeg} />
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <span className="text-slate-400 font-bold">× {item.quantity}</span>
                </div>
                <div className="font-semibold text-slate-700">₹{item.price * item.quantity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Tabs */}
        <div className="pt-2">
          <div className="flex rounded-lg bg-slate-100 p-1 mb-4">
            <button
              id="tab-accept-action"
              onClick={() => setActionTab('accept')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                actionTab === 'accept'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Accept & Route Order
            </button>
            <button
              id="tab-reject-action"
              onClick={() => setActionTab('reject')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                actionTab === 'reject'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              Reject & Cancel Order
            </button>
          </div>

          {actionTab === 'accept' ? (
            <div className="space-y-3 bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs text-emerald-900">
                Approving this order will automatically push it to the store kitchen preparation queue and notify the customer that the order is being prepared.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={closeInterventionModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  id="confirm-admin-accept-btn"
                  variant="success"
                  size="sm"
                  onClick={handleAccept}
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Admin Accept Order
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-rose-50/50 border border-rose-200 rounded-xl p-4">
              <div>
                <label className="block text-xs font-bold text-rose-900 mb-1">
                  Reason for Admin Rejection:
                </label>
                <select
                  id="reject-reason-select"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 text-slate-800 focus:ring-rose-500 focus:border-rose-500"
                >
                  <option value="Store capacity full / items unavailable during rush">
                    Store capacity full / items unavailable during rush
                  </option>
                  <option value="Store closed / unresponsive kitchen">
                    Store closed / unresponsive kitchen
                  </option>
                  <option value="Delivery address unreachable or out of service zone">
                    Delivery address unreachable or out of service zone
                  </option>
                  <option value="High delivery congestion / no rider available">
                    High delivery congestion / no rider available
                  </option>
                  <option value="Customer requested cancellation">
                    Customer requested cancellation
                  </option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={closeInterventionModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  id="confirm-admin-reject-btn"
                  variant="danger"
                  size="sm"
                  onClick={handleReject}
                  isLoading={isSubmitting}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Admin Reject Order
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
