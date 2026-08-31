import React from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Store } from '../../types';
import { db } from '../../services/storage';
import { MapPin, Phone, Clock, UserCheck, Star, ShoppingBag, IndianRupee, UtensilsCrossed } from 'lucide-react';

export const StoreDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  store: Store | null;
  onEdit: (store: Store) => void;
  onGoToMenu: (storeId: string) => void;
}> = ({ isOpen, onClose, store, onEdit, onGoToMenu }) => {
  if (!store) return null;

  const menuItems = db.getMenuItems().filter((i) => i.storeId === store.id);
  const categories = db.getCategories().filter((c) => c.storeId === store.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={store.name}
      subtitle={`Store ID: ${store.id}`}
      maxWidth="xl"
      id="store-details-modal"
    >
      <div className="space-y-5">
        {/* Banner / Header */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <img
            src={store.logo}
            alt={store.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{store.name}</h3>
              <Badge variant={store.status === 'Active' ? 'success' : 'danger'} dot>
                {store.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{store.description}</p>
          </div>
        </div>

        {/* Store Highlights Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Rating</span>
            <p className="text-lg font-bold text-amber-700 flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {store.rating || 4.5}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Orders</span>
            <p className="text-lg font-bold text-blue-700 mt-0.5">{store.totalOrders || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Sales</span>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">
              ₹{((store.totalSales || 0) / 1000).toFixed(1)}k
            </p>
          </div>
        </div>

        {/* Operational Schedule & Contacts */}
        <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Location:</span> {store.location}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Contact:</span> {store.contactNumber}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Operational Hours:</span> {store.openingTime} - {store.closingTime}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Assigned Manager:</span>{' '}
              {store.managerName ? (
                <span className="font-bold text-slate-900 underline">{store.managerName}</span>
              ) : (
                <span className="text-rose-600 font-medium">None assigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Active Menu Summary */}
        <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-900">Menu Catalog:</span>{' '}
            <span className="text-slate-600">
              {menuItems.length} items across {categories.length} categories
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onClose();
              onGoToMenu(store.id);
            }}
            leftIcon={<UtensilsCrossed className="w-3.5 h-3.5" />}
          >
            Manage Menu
          </Button>
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
              onEdit(store);
            }}
          >
            Edit Store
          </Button>
        </div>
      </div>
    </Modal>
  );
};
