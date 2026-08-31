import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Order, DeliveryPartner } from '../../types';
import { orderService } from '../../services/api/orderService';
import { partnerService } from '../../services/api/partnerService';
import { useToast } from '../../context/ToastContext';
import { Bike, UserCheck, Star, MapPin } from 'lucide-react';

interface AssignPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: () => void;
}

export const AssignPartnerModal: React.FC<AssignPartnerModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      partnerService.getPartners().then((res) => {
        setPartners(res.filter((p) => p.accountStatus === 'Active'));
        if (order?.assignedPartnerId) {
          setSelectedPartnerId(order.assignedPartnerId);
        } else {
          setSelectedPartnerId('');
        }
      });
    }
  }, [isOpen, order]);

  if (!order) return null;

  const handleAssign = async () => {
    if (!selectedPartnerId) {
      error('Selection Required', 'Please select a delivery partner to assign.');
      return;
    }

    setIsSubmitting(true);
    try {
      await orderService.assignPartner(order.id, selectedPartnerId);
      const partner = partners.find((p) => p.id === selectedPartnerId);
      success(
        'Delivery Partner Assigned',
        `${partner?.name || 'Rider'} has been assigned to Order #${order.id}.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Assignment Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Delivery Partner: Order #${order.id}`}
      subtitle={`Store: ${order.storeName} → ${order.deliveryAddress.hostelOrPgName}`}
      maxWidth="md"
      id="assign-partner-modal"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600">
          Select an available delivery rider from the active fleet to fulfill this order.
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {partners.map((partner) => {
            const isSelected = selectedPartnerId === partner.id;
            const isOnline = partner.onlineStatus === 'Online';
            return (
              <div
                key={partner.id}
                onClick={() => setSelectedPartnerId(partner.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 font-bold text-xs">
                    <Bike className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <span>{partner.name}</span>
                      <Badge variant={isOnline ? 'success' : 'neutral'} size="sm" dot>
                        {partner.onlineStatus}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{partner.phone}</span>
                      <span>•</span>
                      <span className="font-mono">{partner.vehicleNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1 justify-end">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {partner.rating}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {partner.totalDeliveriesCompleted} orders
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            id="confirm-assign-partner-btn"
            size="sm"
            onClick={handleAssign}
            isLoading={isSubmitting}
            leftIcon={<UserCheck className="w-4 h-4" />}
          >
            Confirm Assignment
          </Button>
        </div>
      </div>
    </Modal>
  );
};
