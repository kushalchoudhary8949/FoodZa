import React, { useState, useEffect } from 'react';
import { Offer } from '../../types';
import { offerService } from '../../services/api/offerService';
import { OfferModal } from './OfferModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  Tag,
  Plus,
  Search,
  Calendar,
  Percent,
  IndianRupee,
  Edit2,
  Trash2,
  CheckCircle2,
  Store as StoreIcon,
  Sparkles,
} from 'lucide-react';

export const OffersPage: React.FC = () => {
  const { success, error } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      const data = await offerService.getOffers();
      setOffers(data);
    } catch {
      error('Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();

    const handleDbChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'foodfleet_offers') {
        loadOffers();
      }
    };
    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, []);

  const handleToggleStatus = async (offer: Offer) => {
    try {
      const updated = await offerService.toggleOfferStatus(offer.id);
      const isNowActive = updated.status === 'Active' || updated.isActive;
      success(
        isNowActive ? 'Offer Activated' : 'Offer Paused',
        `Coupon ${offer.couponCode} is now ${isNowActive ? 'live' : 'disabled'}.`
      );
      loadOffers();
    } catch (err: any) {
      error('Status Update Failed', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!offerToDelete) return;
    setIsDeleting(true);
    try {
      await offerService.deleteOffer(offerToDelete.id);
      success('Offer Deleted', `Coupon ${offerToDelete.couponCode} removed.`);
      setIsDeleteDialogOpen(false);
      setOfferToDelete(null);
      loadOffers();
    } catch (err: any) {
      error('Deletion Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOffers = offers.filter((off) => {
    const titleText = off.title || off.name || '';
    const codeText = off.couponCode || '';
    const matchesSearch =
      titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      codeText.toLowerCase().includes(searchQuery.toLowerCase());

    const isAct = off.isActive !== undefined ? off.isActive : off.status === 'Active';
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? isAct
        : !isAct;

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="offers-management-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Offers, Coupons & Sales Campaigns</h2>
          <p className="text-xs text-slate-500">
            Create coupon codes, percentage discounts, minimum cart values, and store-specific promos
          </p>
        </div>

        <Button
          id="create-offer-main-btn"
          size="md"
          onClick={() => {
            setEditingOffer(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Offer
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-offer-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search offer title or promo code (e.g. WELCOME50)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="filter-offer-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Campaigns ({offers.length})</option>
            <option value="ACTIVE">Active Promos ({offers.filter((o) => o.isActive).length})</option>
            <option value="INACTIVE">Paused Promos ({offers.filter((o) => !o.isActive).length})</option>
          </select>
        </div>
      </div>

      {/* Offers Grid */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} columns={4} />
        </div>
      ) : filteredOffers.length === 0 ? (
        <EmptyState
          title="No Promotional Offers Found"
          description="No offers match your criteria. Create a new campaign to boost orders."
          actionLabel="Create Offer"
          onAction={() => {
            setEditingOffer(null);
            setIsFormModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map((offer) => {
            const isLive = offer.isActive !== undefined ? offer.isActive : offer.status === 'Active';
            const displayTitle = offer.title || offer.name || 'Promotional Offer';

            return (
              <div
                key={offer.id}
                id={`offer-card-${offer.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header Coupon Pill */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/30 tracking-wider">
                        {offer.couponCode}
                      </span>
                    </div>
                    <Badge variant={isLive ? 'success' : 'neutral'} dot size="sm">
                      {isLive ? 'Active' : 'Paused'}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-tight mb-2">
                    {displayTitle}
                  </h3>

                  {/* Discount Formula Tag */}
                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 mb-4">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium">Discount Value:</span>
                      <span className="font-bold text-amber-700 text-sm">
                        {offer.discountType === 'Percentage'
                          ? `${offer.discountValue}% OFF`
                          : `₹${offer.discountValue} FLAT OFF`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600 text-[11px]">
                      <span>Min Order Requirement:</span>
                      <span className="font-semibold text-slate-800">₹{offer.minOrderValue}</span>
                    </div>

                    {offer.maxDiscount && (
                      <div className="flex justify-between items-center text-slate-600 text-[11px]">
                        <span>Max Discount Cap:</span>
                        <span className="font-semibold text-slate-800">₹{offer.maxDiscount}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                      <span>Applicable Outlets:</span>
                      <span className="font-semibold text-slate-800">
                        {offer.applicableStoreNames && offer.applicableStoreNames.length > 0
                          ? offer.applicableStoreNames.join(', ')
                          : 'All Stores'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-500 text-[10px]">
                      <span>Validity:</span>
                      <span>
                        {offer.startDate} to {offer.endDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Strip */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <Button
                    id={`edit-offer-${offer.id}`}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingOffer(offer);
                      setIsFormModalOpen(true);
                    }}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    className="flex-1 text-xs"
                  >
                    Edit
                  </Button>

                  <Button
                    id={`toggle-offer-${offer.id}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(offer)}
                    className={`text-xs px-2.5 ${
                      isLive ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {isLive ? 'Pause' : 'Activate'}
                  </Button>

                  <Button
                    id={`delete-offer-${offer.id}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setOfferToDelete(offer);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-xs px-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <OfferModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        offerToEdit={editingOffer}
        onSuccess={loadOffers}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Offer Campaign"
        message={`Are you sure you want to delete coupon "${offerToDelete?.couponCode}"? Customers will no longer be able to apply it.`}
        confirmLabel="Delete Coupon"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
