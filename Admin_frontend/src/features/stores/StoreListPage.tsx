import React, { useState, useEffect } from 'react';
import { Store, StoreStatus } from '../../types';
import { storeService } from '../../services/api/storeService';
import { StoreModal } from './StoreModal';
import { StoreDetailsModal } from './StoreDetailsModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  Store as StoreIcon,
  Plus,
  Search,
  Clock,
  MapPin,
  Eye,
  Edit2,
  Power,
  Trash2,
  UtensilsCrossed,
  User,
} from 'lucide-react';
import { NavTab } from '../../components/layout/Sidebar';

export const StoreListPage: React.FC<{ onNavigateToMenu: (storeId: string) => void }> = ({
  onNavigateToMenu,
}) => {
  const { success, error } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const data = await storeService.getStores();
      setStores(data);
    } catch {
      error('Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStores();

    const handleDbChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'foodfleet_stores') {
        loadStores();
      }
    };
    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, []);

  const handleToggleStatus = async (store: Store) => {
    try {
      const updated = await storeService.toggleStoreStatus(store.id);
      success(
        updated.status === 'Active' ? 'Store Activated' : 'Store Disabled',
        `${store.name} is now ${updated.status}.`
      );
      loadStores();
    } catch (err: any) {
      error('Status Update Failed', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!storeToDelete) return;
    setIsDeleting(true);
    try {
      await storeService.deleteStore(storeToDelete.id);
      success('Store Deleted', `${storeToDelete.name} was removed from the system.`);
      setIsDeleteDialogOpen(false);
      setStoreToDelete(null);
      loadStores();
    } catch (err: any) {
      error('Deletion Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered stores
  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (store.managerName && store.managerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ? true : store.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="store-management-page" className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Store Management</h2>
          <p className="text-xs text-slate-500">
            Configure partner restaurants, operating hours, managers and outlet status
          </p>
        </div>

        <Button
          id="add-store-main-btn"
          size="md"
          onClick={() => {
            setEditingStore(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Store
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-store-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search store name, location, or manager..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="filter-store-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Status ({stores.length})</option>
            <option value="Active">Active ({stores.filter((s) => s.status === 'Active').length})</option>
            <option value="Inactive">Inactive ({stores.filter((s) => s.status === 'Inactive').length})</option>
          </select>
        </div>
      </div>

      {/* Stores List Grid */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={5} columns={4} />
        </div>
      ) : filteredStores.length === 0 ? (
        <EmptyState
          title="No Stores Found"
          description="No restaurants matching your search criteria were found. Add a new store or modify your filter."
          actionLabel="Add Store"
          onAction={() => {
            setEditingStore(null);
            setIsFormModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              id={`store-card-${store.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Store Header */}
                <div className="flex items-start gap-3.5 mb-3">
                  <img
                    src={store.logo}
                    alt={store.name}
                    className="w-13 h-13 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-base text-slate-900 truncate">{store.name}</h3>
                      <Badge variant={store.status === 'Active' ? 'success' : 'danger'} dot size="sm">
                        {store.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{store.location}</span>
                    </div>
                  </div>
                </div>

                {/* Manager & Timings Box */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 mb-4">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Manager:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {store.managerName || <span className="text-rose-500 font-normal">Unassigned</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Hours:
                    </span>
                    <span className="text-slate-700 font-medium">
                      {store.openingTime} - {store.closingTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: [View] [Edit] [Disable/Enable] [Delete] */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <Button
                  id={`view-store-${store.id}`}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStore(store);
                    setIsDetailsModalOpen(true);
                  }}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  className="flex-1 text-xs px-2"
                >
                  View
                </Button>

                <Button
                  id={`edit-store-${store.id}`}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingStore(store);
                    setIsFormModalOpen(true);
                  }}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  className="flex-1 text-xs px-2"
                >
                  Edit
                </Button>

                <Button
                  id={`toggle-status-store-${store.id}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleStatus(store)}
                  className={`text-xs px-2 ${
                    store.status === 'Active' ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                  title={store.status === 'Active' ? 'Disable store' : 'Activate store'}
                >
                  {store.status === 'Active' ? 'Disable' : 'Enable'}
                </Button>

                <Button
                  id={`delete-store-${store.id}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setStoreToDelete(store);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-xs px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  title="Delete store"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <StoreModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        storeToEdit={editingStore}
        onSuccess={loadStores}
      />

      {/* View Details Modal */}
      <StoreDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        store={selectedStore}
        onEdit={(st) => {
          setEditingStore(st);
          setIsFormModalOpen(true);
        }}
        onGoToMenu={(storeId) => onNavigateToMenu(storeId)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Store Confirmation"
        message={`Are you sure you want to delete "${storeToDelete?.name}"? All associated store configurations will be removed.`}
        confirmLabel="Delete Store"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
