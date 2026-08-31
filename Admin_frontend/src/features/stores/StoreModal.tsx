import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Store, StoreManager, StoreStatus } from '../../types';
import { storeService } from '../../services/api/storeService';
import { db } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import { Store as StoreIcon, Clock, Phone, MapPin, Image, UserCheck } from 'lucide-react';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeToEdit?: Store | null;
  onSuccess: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  storeToEdit,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [openingTime, setOpeningTime] = useState('10:00 AM');
  const [closingTime, setClosingTime] = useState('11:00 PM');
  const [status, setStatus] = useState<StoreStatus>('Active');
  const [managerId, setManagerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<StoreManager[]>([]);

  useEffect(() => {
    if (isOpen) {
      setManagers(db.getManagers());
      if (storeToEdit) {
        setName(storeToEdit.name);
        setLogo(storeToEdit.logo || '');
        setDescription(storeToEdit.description);
        setLocation(storeToEdit.location);
        setContactNumber(storeToEdit.contactNumber);
        setOpeningTime(storeToEdit.openingTime);
        setClosingTime(storeToEdit.closingTime);
        setStatus(storeToEdit.status);
        setManagerId(storeToEdit.managerId || '');
      } else {
        setName('');
        setLogo('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80');
        setDescription('');
        setLocation('');
        setContactNumber('+91 98765 43210');
        setOpeningTime('10:00 AM');
        setClosingTime('11:00 PM');
        setStatus('Active');
        setManagerId('');
      }
    }
  }, [isOpen, storeToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !contactNumber.trim()) {
      error('Validation Error', 'Please fill in Store Name, Location, and Contact Number.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (storeToEdit) {
        await storeService.updateStore({
          id: storeToEdit.id,
          name,
          logo,
          description,
          location,
          contactNumber,
          openingTime,
          closingTime,
          status,
          managerId: managerId || undefined,
        });
        success('Store Updated', `${name} details updated successfully.`);
      } else {
        await storeService.createStore({
          name,
          logo,
          description,
          location,
          contactNumber,
          openingTime,
          closingTime,
          status,
          managerId: managerId || undefined,
        });
        success('Store Added', `${name} has been added to the platform.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to save store', err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={storeToEdit ? `Edit Store: ${storeToEdit.name}` : 'Add New Store'}
      subtitle="Configure store information, operational schedule, and manager"
      maxWidth="2xl"
      id="store-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Store Name & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Store Name *
            </label>
            <input
              id="store-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. KFC, Pizza Hut, Subway"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Status
            </label>
            <select
              id="store-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as StoreStatus)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive / Disabled</option>
            </select>
          </div>
        </div>

        {/* Store Logo URL & Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Store Logo / Image URL
          </label>
          <input
            id="store-logo-input"
            type="url"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://..."
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="store-description-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Crispy fried chicken, burgers, meals & sides..."
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Location & Contact Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Location / Address *
            </label>
            <input
              id="store-location-input"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Food Street, Near North Gate"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Contact Number *
            </label>
            <input
              id="store-contact-input"
              type="text"
              required
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Timings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Opening Time
            </label>
            <input
              id="store-opening-time"
              type="text"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              placeholder="10:00 AM"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Closing Time
            </label>
            <input
              id="store-closing-time"
              type="text"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              placeholder="11:30 PM"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Assign Store Owner / Manager */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Assign Store Owner / Manager
          </label>
          <select
            id="store-manager-select"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- No Manager Assigned --</option>
            {managers.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.name} ({mgr.loginId}) {mgr.assignedStoreName ? `— currently at ${mgr.assignedStoreName}` : '— Unassigned'}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            The assigned manager will only receive and accept orders for this store.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button id="save-store-btn" type="submit" size="sm" isLoading={isSubmitting}>
            {storeToEdit ? 'Save Changes' : 'Add Store'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
