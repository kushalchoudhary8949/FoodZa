import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { StoreManager, Store, ManagerAccountStatus } from '../../types';
import { managerService } from '../../services/api/managerService';
import { db } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import { User, Phone, Mail, Store as StoreIcon, ShieldCheck } from 'lucide-react';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerToEdit?: StoreManager | null;
  onSuccess: () => void;
}

export const ManagerModal: React.FC<ManagerModalProps> = ({
  isOpen,
  onClose,
  managerToEdit,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loginId, setLoginId] = useState('');
  const [assignedStoreId, setAssignedStoreId] = useState('');
  const [accountStatus, setAccountStatus] = useState<ManagerAccountStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStores(db.getStores());
      if (managerToEdit) {
        setName(managerToEdit.name);
        setPhone(managerToEdit.phoneNumber || managerToEdit.phone || '');
        setEmail(managerToEdit.email);
        setLoginId(managerToEdit.loginId);
        setAssignedStoreId(managerToEdit.assignedStoreId || '');
        setAccountStatus((managerToEdit.status || managerToEdit.accountStatus || 'Active') as ManagerAccountStatus);
      } else {
        setName('');
        setPhone('+91 98');
        setEmail('');
        setLoginId('');
        setAssignedStoreId('');
        setAccountStatus('Active');
      }
    }
  }, [isOpen, managerToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !loginId.trim()) {
      error('Validation Error', 'Please fill in Name, Phone, Email, and Login ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (managerToEdit) {
        await managerService.updateManager({
          id: managerToEdit.id,
          name,
          phone,
          email,
          loginId,
          assignedStoreId: assignedStoreId || undefined,
          accountStatus,
        });
        success('Manager Updated', `${name}'s profile was updated successfully.`);
      } else {
        await managerService.createManager({
          name,
          phone,
          email,
          loginId,
          assignedStoreId: assignedStoreId || undefined,
          accountStatus,
        });
        success('Manager Created', `${name} can now sign in with Login ID: ${loginId}.`);
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
      title={managerToEdit ? `Edit Store Owner: ${managerToEdit.name}` : 'Add Store Owner / Manager'}
      subtitle="Configure store manager access credentials and outlet assignment"
      maxWidth="lg"
      id="manager-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            id="manager-name-input"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Login ID & Account Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Login ID / Username *
            </label>
            <input
              id="manager-login-id"
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. mgr_kfc"
              className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Account Status
            </label>
            <select
              id="manager-status-select"
              value={accountStatus}
              onChange={(e) => setAccountStatus(e.target.value as ManagerAccountStatus)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive / Suspended</option>
            </select>
          </div>
        </div>

        {/* Email & Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              id="manager-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@store.foodfleet.internal"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number *
            </label>
            <input
              id="manager-phone-input"
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Assigned Store */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Assigned Store Outlet
          </label>
          <select
            id="manager-assigned-store"
            value={assignedStoreId}
            onChange={(e) => setAssignedStoreId(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- No Store Assigned (Floating Manager) --</option>
            {stores.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} — {st.location}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Orders from this store are pushed to this manager's portal with an automated timeout SLA.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button id="save-manager-btn" type="submit" size="sm" isLoading={isSubmitting}>
            {managerToEdit ? 'Save Changes' : 'Create Manager'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
