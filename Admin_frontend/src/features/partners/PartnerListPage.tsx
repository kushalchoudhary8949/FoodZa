import React, { useState, useEffect } from 'react';
import { DeliveryPartner } from '../../types';
import { partnerService } from '../../services/api/partnerService';
import { PartnerModal } from './PartnerModal';
import { PartnerDetailsModal } from './PartnerDetailsModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  Bike,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Star,
  IndianRupee,
  PackageCheck,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const PartnerListPage: React.FC = () => {
  const { success, error } = useToast();
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [onlineFilter, setOnlineFilter] = useState<string>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<DeliveryPartner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const data = await partnerService.getPartners();
      setPartners(data);
    } catch {
      error('Failed to load delivery partners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();

    const handleDbChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'foodfleet_partners') {
        loadPartners();
      }
    };
    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, []);

  const handleToggleAccountStatus = async (p: DeliveryPartner) => {
    try {
      const updated = await partnerService.toggleAccountStatus(p.id);
      success(
        updated.accountStatus === 'Active' ? 'Partner Activated' : 'Partner Suspended',
        `${p.name} account is now ${updated.accountStatus}.`
      );
      loadPartners();
    } catch (err: any) {
      error('Status Update Failed', err.message);
    }
  };

  const handleToggleOnlineStatus = async (p: DeliveryPartner) => {
    try {
      const updated = await partnerService.toggleOnlineStatus(p.id);
      success(
        'Rider Status Changed',
        `${p.name} is now marked ${updated.onlineStatus}.`
      );
      loadPartners();
    } catch (err: any) {
      error('Online Toggle Failed', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!partnerToDelete) return;
    setIsDeleting(true);
    try {
      await partnerService.deletePartner(partnerToDelete.id);
      success('Partner Deleted', `${partnerToDelete.name} was removed from the fleet.`);
      setIsDeleteDialogOpen(false);
      setPartnerToDelete(null);
      loadPartners();
    } catch (err: any) {
      error('Deletion Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ? true : p.accountStatus === statusFilter;

    const matchesOnline =
      onlineFilter === 'ALL' ? true : p.onlineStatus === onlineFilter;

    return matchesSearch && matchesStatus && matchesOnline;
  });

  return (
    <div id="partner-management-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Delivery Partner Fleet</h2>
          <p className="text-xs text-slate-500">
            Monitor active riders, onboard new partners, manage vehicle specs, and track delivery earnings
          </p>
        </div>

        <Button
          id="add-partner-main-btn"
          size="md"
          onClick={() => {
            setEditingPartner(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Onboard Delivery Partner
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-partner-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rider by name, phone, or vehicle number..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="filter-partner-online"
            value={onlineFilter}
            onChange={(e) => setOnlineFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Online States ({partners.length})</option>
            <option value="Online">🟢 Online ({partners.filter((p) => p.onlineStatus === 'Online').length})</option>
            <option value="Offline">⚫ Offline ({partners.filter((p) => p.onlineStatus === 'Offline').length})</option>
          </select>

          <select
            id="filter-partner-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Accounts</option>
            <option value="Active">Active ({partners.filter((p) => p.accountStatus === 'Active').length})</option>
            <option value="Inactive">Suspended ({partners.filter((p) => p.accountStatus === 'Inactive').length})</option>
          </select>
        </div>
      </div>

      {/* Partners List */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={5} columns={6} />
        </div>
      ) : filteredPartners.length === 0 ? (
        <EmptyState
          title="No Delivery Partners Found"
          description="No riders match your search filter criteria. Add a new partner or modify filters."
          actionLabel="Onboard Partner"
          onAction={() => {
            setEditingPartner(null);
            setIsFormModalOpen(true);
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Delivery Partner</th>
                  <th className="px-5 py-3.5">Vehicle Info</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Rating & Trips</th>
                  <th className="px-5 py-3.5">Total Earnings</th>
                  <th className="px-5 py-3.5">Availability</th>
                  <th className="px-5 py-3.5">Account</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {partner.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{partner.name}</div>
                          <div className="text-[10px] text-slate-400">ID: {partner.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-mono font-semibold text-slate-800">{partner.vehicleNumber}</div>
                      <div className="text-slate-500 text-[11px]">{partner.vehicleType}</div>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-800">{partner.phone}</td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{partner.rating}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{partner.totalDeliveriesCompleted} delivered</div>
                    </td>

                    <td className="px-5 py-4 font-bold text-emerald-700 text-sm">
                      ₹{partner.totalEarnings.toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleOnlineStatus(partner)}
                        className="inline-flex items-center gap-1.5 cursor-pointer group"
                        title="Click to toggle Online/Offline"
                      >
                        <Badge
                          variant={partner.onlineStatus === 'Online' ? 'success' : 'neutral'}
                          dot
                          size="sm"
                          className="group-hover:ring-1 ring-slate-400"
                        >
                          {partner.onlineStatus}
                        </Badge>
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <Badge
                        variant={partner.accountStatus === 'Active' ? 'success' : 'danger'}
                        dot
                        size="sm"
                      >
                        {partner.accountStatus}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          id={`view-partner-${partner.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedPartner(partner);
                            setIsDetailsModalOpen(true);
                          }}
                          className="text-xs px-2"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          id={`edit-partner-${partner.id}`}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPartner(partner);
                            setIsFormModalOpen(true);
                          }}
                          className="text-xs px-2.5"
                        >
                          Edit
                        </Button>

                        <Button
                          id={`toggle-partner-${partner.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleAccountStatus(partner)}
                          className={`text-xs px-2 ${
                            partner.accountStatus === 'Active' ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {partner.accountStatus === 'Active' ? 'Suspend' : 'Activate'}
                        </Button>

                        <Button
                          id={`delete-partner-${partner.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPartnerToDelete(partner);
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
      <PartnerModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        partnerToEdit={editingPartner}
        onSuccess={loadPartners}
      />

      {/* View Details Modal */}
      <PartnerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        partner={selectedPartner}
        onEdit={(p) => {
          setEditingPartner(p);
          setIsFormModalOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Delivery Partner"
        message={`Are you sure you want to remove "${partnerToDelete?.name}" from the active delivery fleet?`}
        confirmLabel="Remove Partner"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
