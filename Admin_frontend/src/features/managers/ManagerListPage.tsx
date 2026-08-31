import React, { useState, useEffect } from 'react';
import { StoreManager } from '../../types';
import { managerService } from '../../services/api/managerService';
import { ManagerModal } from './ManagerModal';
import { ManagerDetailsModal } from './ManagerDetailsModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Store as StoreIcon,
  ShieldCheck,
} from 'lucide-react';

export const ManagerListPage: React.FC = () => {
  const { success, error } = useToast();
  const [managers, setManagers] = useState<StoreManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<StoreManager | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<StoreManager | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<StoreManager | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadManagers = async () => {
    setIsLoading(true);
    try {
      const data = await managerService.getManagers();
      setManagers(data);
    } catch {
      error('Failed to load store managers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();

    const handleDbChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (
        customEvent.detail?.key === 'foodfleet_managers' ||
        customEvent.detail?.key === 'foodfleet_stores'
      ) {
        loadManagers();
      }
    };
    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, []);

  const handleToggleStatus = async (mgr: StoreManager) => {
    try {
      const updated = await managerService.toggleStatus(mgr.id);
      const st = updated.status || updated.accountStatus || 'Active';
      success(
        st === 'Active' ? 'Account Activated' : 'Account Suspended',
        `${mgr.name}'s account is now ${st}.`
      );
      loadManagers();
    } catch (err: any) {
      error('Status Update Failed', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!managerToDelete) return;
    setIsDeleting(true);
    try {
      await managerService.deleteManager(managerToDelete.id);
      success('Manager Deleted', `${managerToDelete.name} was removed.`);
      setIsDeleteDialogOpen(false);
      setManagerToDelete(null);
      loadManagers();
    } catch (err: any) {
      error('Deletion Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredManagers = managers.filter((mgr) => {
    const matchesSearch =
      mgr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mgr.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mgr.phone.includes(searchQuery) ||
      mgr.loginId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mgr.assignedStoreName && mgr.assignedStoreName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ? true : mgr.accountStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="manager-management-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Store Owners & Managers</h2>
          <p className="text-xs text-slate-500">
            Manage store partner accounts, login IDs, assigned outlets, and active states
          </p>
        </div>

        <Button
          id="add-manager-main-btn"
          size="md"
          onClick={() => {
            setEditingManager(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Store Owner
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-manager-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, login ID, email, phone, or store..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="filter-manager-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Status ({managers.length})</option>
            <option value="Active">Active ({managers.filter((m) => m.accountStatus === 'Active').length})</option>
            <option value="Inactive">Inactive ({managers.filter((m) => m.accountStatus === 'Inactive').length})</option>
          </select>
        </div>
      </div>

      {/* Manager Table */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={5} columns={5} />
        </div>
      ) : filteredManagers.length === 0 ? (
        <EmptyState
          title="No Managers Found"
          description="No store owners or managers match your criteria. Add a manager or clear search filters."
          actionLabel="Add Store Owner"
          onAction={() => {
            setEditingManager(null);
            setIsFormModalOpen(true);
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Store Owner</th>
                  <th className="px-5 py-3.5">Login ID</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Assigned Store</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredManagers.map((mgr) => (
                  <tr key={mgr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {mgr.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{mgr.name}</div>
                          <div className="text-[10px] text-slate-400">ID: {mgr.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono font-medium text-slate-800">
                      @{mgr.loginId}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-slate-900 font-medium">{mgr.phone}</div>
                      <div className="text-slate-500 text-[11px]">{mgr.email}</div>
                    </td>

                    <td className="px-5 py-4">
                      {mgr.assignedStoreName ? (
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <StoreIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{mgr.assignedStoreName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <Badge variant={mgr.accountStatus === 'Active' ? 'success' : 'danger'} dot size="sm">
                        {mgr.accountStatus}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          id={`view-mgr-${mgr.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedManager(mgr);
                            setIsDetailsModalOpen(true);
                          }}
                          className="text-xs px-2"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          id={`edit-mgr-${mgr.id}`}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingManager(mgr);
                            setIsFormModalOpen(true);
                          }}
                          className="text-xs px-2.5"
                        >
                          Edit
                        </Button>

                        <Button
                          id={`toggle-mgr-${mgr.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(mgr)}
                          className={`text-xs px-2 ${
                            mgr.accountStatus === 'Active' ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {mgr.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                        </Button>

                        <Button
                          id={`delete-mgr-${mgr.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setManagerToDelete(mgr);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-xs px-2 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <ManagerModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        managerToEdit={editingManager}
        onSuccess={loadManagers}
      />

      {/* View Details Modal */}
      <ManagerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        manager={selectedManager}
        onEdit={(mgr) => {
          setEditingManager(mgr);
          setIsFormModalOpen(true);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Store Owner"
        message={`Are you sure you want to delete ${managerToDelete?.name}? The assigned store will become unmanaged until a new manager is assigned.`}
        confirmLabel="Delete Manager"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
