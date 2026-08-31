import React from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DeliveryPartner } from '../../types';
import { db } from '../../services/storage';
import {
  Bike,
  Phone,
  CheckCircle,
  IndianRupee,
  Star,
  Calendar,
  PackageCheck,
  MapPin,
} from 'lucide-react';

export const PartnerDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  partner: DeliveryPartner | null;
  onEdit: (partner: DeliveryPartner) => void;
}> = ({ isOpen, onClose, partner, onEdit }) => {
  if (!partner) return null;

  // Retrieve assigned delivery history
  const partnerOrders = db
    .getOrders()
    .filter((o) => o.deliveryPartnerId === partner.id || o.assignedPartnerId === partner.id);

  const deliveriesCount = partner.totalDeliveries ?? (partner as any).totalDeliveriesCompleted ?? 0;
  const phoneVal = partner.phoneNumber || (partner as any).phone || 'N/A';
  const dateVal = partner.joinedDate || (partner as any).createdAt || 'N/A';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={partner.name}
      subtitle={`Partner ID: ${partner.id}`}
      maxWidth="lg"
      id="partner-details-modal"
    >
      <div className="space-y-4">
        {/* Profile Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xl shrink-0">
            <Bike className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 truncate">{partner.name}</h3>
              <Badge variant={partner.accountStatus === 'Active' ? 'success' : 'danger'} dot size="sm">
                {partner.accountStatus}
              </Badge>
              <Badge variant={partner.onlineStatus === 'Online' ? 'success' : 'neutral'} dot size="sm">
                {partner.onlineStatus}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="font-mono">{partner.vehicleNumber}</span>
              <span>•</span>
              <span>{partner.vehicleType}</span>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Earnings</span>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">₹{partner.totalEarnings.toLocaleString()}</p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Deliveries</span>
            <p className="text-lg font-bold text-blue-700 mt-0.5">{deliveriesCount}</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Rider Rating</span>
            <p className="text-lg font-bold text-amber-700 flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {partner.rating}
            </p>
          </div>
        </div>

        {/* Contact Info & Details */}
        <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Phone:</span> {phoneVal}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Onboarded:</span> {dateVal}
            </div>
          </div>
        </div>

        {/* Recent Delivery History */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100/70 px-4 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Assigned Deliveries ({partnerOrders.length})</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {partnerOrders.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No deliveries recorded yet for this partner.
              </div>
            ) : (
              partnerOrders.map((order) => (
                <div key={order.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">Order #{order.id} • {order.storeName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {order.deliveryAddress.hostelOrPgName}, Room {order.deliveryAddress.roomNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">₹{order.total}</span>
                    <div className="text-[10px] text-slate-400">{order.orderStatus}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onClose();
              onEdit(partner);
            }}
          >
            Edit Partner
          </Button>
        </div>
      </div>
    </Modal>
  );
};
