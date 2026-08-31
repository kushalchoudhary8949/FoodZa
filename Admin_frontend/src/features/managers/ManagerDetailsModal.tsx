import React from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StoreManager } from '../../types';
import { db } from '../../services/storage';
import { User, Phone, Mail, Store as StoreIcon, Shield, Clock, Calendar } from 'lucide-react';

export const ManagerDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  manager: StoreManager | null;
  onEdit: (mgr: StoreManager) => void;
}> = ({ isOpen, onClose, manager, onEdit }) => {
  if (!manager) return null;

  const assignedStore = manager.assignedStoreId
    ? db.getStores().find((s) => s.id === manager.assignedStoreId)
    : null;
  const storeOrders = assignedStore
    ? db.getOrders().filter((o) => o.storeId === assignedStore.id)
    : [];

  const statusVal = manager.status || manager.accountStatus || 'Active';
  const phoneVal = manager.phoneNumber || manager.phone || 'N/A';
  const dateVal = manager.joinedDate || manager.createdAt || 'N/A';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={manager.name}
      subtitle={`Manager ID: ${manager.id}`}
      maxWidth="md"
      id="manager-details-modal"
    >
      <div className="space-y-4">
        {/* Profile Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {manager.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 truncate">{manager.name}</h3>
              <Badge variant={statusVal === 'Active' ? 'success' : 'danger'} dot size="sm">
                {statusVal}
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-0.5">Login ID: @{manager.loginId}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Email:</span> {manager.email}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Phone:</span> {phoneVal}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Registered:</span> {dateVal}
            </div>
          </div>
        </div>

        {/* Assigned Store Section */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <StoreIcon className="w-4 h-4 text-amber-600" /> Assigned Store
          </h4>
          {assignedStore ? (
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm">{assignedStore.name}</span>
                <span className="block text-slate-500">{assignedStore.location}</span>
              </div>
              <Badge variant="info">
                {storeOrders.length} Total Orders Handled
              </Badge>
            </div>
          ) : (
            <div className="text-xs text-rose-600 font-medium">
              No store currently assigned to this manager account.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onClose();
              onEdit(manager);
            }}
          >
            Edit Manager
          </Button>
        </div>
      </div>
    </Modal>
  );
};
