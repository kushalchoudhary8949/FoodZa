import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { DeliveryPartner, PartnerAccountStatus, PartnerOnlineStatus } from '../../types';
import { partnerService } from '../../services/api/partnerService';
import { useToast } from '../../context/ToastContext';
import { Bike, Phone, User, Shield } from 'lucide-react';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerToEdit?: DeliveryPartner | null;
  onSuccess: () => void;
}

export const PartnerModal: React.FC<PartnerModalProps> = ({
  isOpen,
  onClose,
  partnerToEdit,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Bike');
  const [accountStatus, setAccountStatus] = useState<PartnerAccountStatus>('Active');
  const [onlineStatus, setOnlineStatus] = useState<PartnerOnlineStatus>('Online');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (partnerToEdit) {
        setName(partnerToEdit.name);
        setPhone(partnerToEdit.phoneNumber || (partnerToEdit as any).phone || '');
        setVehicleNumber(partnerToEdit.vehicleNumber || '');
        setVehicleType(partnerToEdit.vehicleType || 'Bike');
        setAccountStatus((partnerToEdit.accountStatus || (partnerToEdit as any).status || 'Active') as PartnerAccountStatus);
        setOnlineStatus(partnerToEdit.onlineStatus || 'Online');
      } else {
        setName('');
        setPhone('+91 98');
        setVehicleNumber('KA 03 EQ 1234');
        setVehicleType('Bike');
        setAccountStatus('Active');
        setOnlineStatus('Online');
      }
    }
  }, [isOpen, partnerToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !vehicleNumber.trim()) {
      error('Validation Error', 'Please fill in Name, Phone, and Vehicle Number.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (partnerToEdit) {
        await partnerService.updatePartner({
          id: partnerToEdit.id,
          name,
          phone,
          vehicleNumber,
          vehicleType,
          accountStatus,
          onlineStatus,
        });
        success('Partner Updated', `${name}'s rider profile was updated.`);
      } else {
        await partnerService.createPartner({
          name,
          phone,
          vehicleNumber,
          vehicleType,
          accountStatus,
          onlineStatus,
        });
        success('Partner Onboarded', `${name} is ready for deliveries.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={partnerToEdit ? `Edit Rider: ${partnerToEdit.name}` : 'Onboard Delivery Partner'}
      subtitle="Configure delivery fleet partner profile and vehicle specifications"
      maxWidth="md"
      id="partner-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            id="partner-name-input"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Phone Number *
          </label>
          <input
            id="partner-phone-input"
            type="text"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Vehicle Number & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Vehicle Registration No. *
            </label>
            <input
              id="partner-vehicle-input"
              type="text"
              required
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="KA 03 EQ 4567"
              className="w-full text-sm uppercase font-mono rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Vehicle Type
            </label>
            <select
              id="partner-vehicletype-select"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="Bike">Motorbike (Bike)</option>
              <option value="Scooter">Electric Scooter / EV</option>
              <option value="Bicycle">Bicycle</option>
            </select>
          </div>
        </div>

        {/* Account & Online Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Account Status
            </label>
            <select
              id="partner-accountstatus-select"
              value={accountStatus}
              onChange={(e) => setAccountStatus(e.target.value as PartnerAccountStatus)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="Active">Active / Approved</option>
              <option value="Inactive">Inactive / Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Online Availability
            </label>
            <select
              id="partner-onlinestatus-select"
              value={onlineStatus}
              onChange={(e) => setOnlineStatus(e.target.value as PartnerOnlineStatus)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="Online">🟢 Online (Ready for orders)</option>
              <option value="Offline">⚫ Offline (Off-duty)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button id="save-partner-btn" type="submit" size="sm" isLoading={isSubmitting}>
            {partnerToEdit ? 'Save Changes' : 'Onboard Partner'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
