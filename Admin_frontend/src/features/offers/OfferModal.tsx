import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Offer, Store, DiscountType } from '../../types';
import { offerService } from '../../services/api/offerService';
import { storeService } from '../../services/api/storeService';
import { useToast } from '../../context/ToastContext';
import { Tag, Calendar, Percent, IndianRupee, Store as StoreIcon } from 'lucide-react';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerToEdit?: Offer | null;
  onSuccess: () => void;
}

export const OfferModal: React.FC<OfferModalProps> = ({
  isOpen,
  onClose,
  offerToEdit,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [title, setTitle] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('Percentage');
  const [discountValue, setDiscountValue] = useState<number | string>(20);
  const [minOrderValue, setMinOrderValue] = useState<number | string>(199);
  const [maxDiscount, setMaxDiscount] = useState<number | string>(100);
  const [storeScope, setStoreScope] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [applicableStoreIds, setApplicableStoreIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-04-30');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      storeService.getStores().then(setStores);
      if (offerToEdit) {
        setTitle(offerToEdit.title || offerToEdit.name || '');
        setCouponCode(offerToEdit.couponCode || '');
        setDiscountType(offerToEdit.discountType || 'Percentage');
        setDiscountValue(offerToEdit.discountValue || 20);
        setMinOrderValue(offerToEdit.minOrderValue || 199);
        setMaxDiscount(offerToEdit.maxDiscount || '');
        if (offerToEdit.applicableStoreIds && offerToEdit.applicableStoreIds.length > 0) {
          setStoreScope('SPECIFIC');
          setApplicableStoreIds(offerToEdit.applicableStoreIds);
        } else {
          setStoreScope('ALL');
          setApplicableStoreIds([]);
        }
        setStartDate(offerToEdit.startDate || '2026-03-01');
        setEndDate(offerToEdit.endDate || '2026-04-30');
        setIsActive(offerToEdit.isActive !== undefined ? offerToEdit.isActive : offerToEdit.status === 'Active');
      } else {
        setTitle('');
        setCouponCode('');
        setDiscountType('Percentage');
        setDiscountValue(20);
        setMinOrderValue(199);
        setMaxDiscount(100);
        setStoreScope('ALL');
        setApplicableStoreIds([]);
        setStartDate('2026-03-01');
        setEndDate('2026-04-30');
        setIsActive(true);
      }
    }
  }, [isOpen, offerToEdit]);

  const handleToggleStoreSelection = (storeId: string) => {
    if (applicableStoreIds.includes(storeId)) {
      setApplicableStoreIds(applicableStoreIds.filter((id) => id !== storeId));
    } else {
      setApplicableStoreIds([...applicableStoreIds, storeId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !couponCode.trim() || Number(discountValue) <= 0) {
      error('Validation Error', 'Please complete the title, coupon code, and discount value.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedNames =
        storeScope === 'SPECIFIC'
          ? stores
              .filter((s) => applicableStoreIds.includes(s.id))
              .map((s) => s.name)
          : [];

      if (offerToEdit) {
        await offerService.updateOffer({
          id: offerToEdit.id,
          title,
          couponCode: couponCode.toUpperCase().trim(),
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrderValue),
          maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
          applicableStoreIds: storeScope === 'SPECIFIC' ? applicableStoreIds : [],
          applicableStoreNames: selectedNames,
          startDate,
          endDate,
          isActive,
        });
        success('Offer Updated', `Coupon ${couponCode} modified successfully.`);
      } else {
        await offerService.createOffer({
          title,
          couponCode: couponCode.toUpperCase().trim(),
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrderValue),
          maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
          applicableStoreIds: storeScope === 'SPECIFIC' ? applicableStoreIds : [],
          applicableStoreNames: selectedNames,
          startDate,
          endDate,
          isActive,
        });
        success('Offer Created', `Coupon ${couponCode} is now active.`);
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
      title={offerToEdit ? `Edit Coupon: ${offerToEdit.couponCode}` : 'Create New Promotional Offer'}
      subtitle="Configure discount formulas, coupon codes, and store eligibility"
      maxWidth="xl"
      id="offer-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title & Coupon Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Offer Campaign Title *
            </label>
            <input
              id="offer-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Welcome 50% Off First Order"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Coupon Promo Code *
            </label>
            <input
              id="offer-coupon-input"
              type="text"
              required
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME50, FOODFEST"
              className="w-full text-sm uppercase font-mono font-bold rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Discount Type & Value */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Discount Calculation
            </label>
            <select
              id="offer-discount-type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="Percentage">Percentage (% Off)</option>
              <option value="Fixed Amount">Fixed Amount (₹ Off)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Discount Value ({discountType === 'Percentage' ? '%' : '₹'}) *
            </label>
            <input
              id="offer-discount-value"
              type="number"
              min="1"
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'Percentage' ? '20' : '100'}
              className="w-full text-sm font-bold rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Max Cap (₹) {discountType === 'Percentage' ? '*' : '(Optional)'}
            </label>
            <input
              id="offer-max-discount"
              type="number"
              min="0"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="e.g. 100"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Min Order Value & Validity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Min Order Value (₹)
            </label>
            <input
              id="offer-min-order"
              type="number"
              min="0"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              placeholder="199"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Start Date
            </label>
            <input
              id="offer-start-date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              End Date
            </label>
            <input
              id="offer-end-date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Applicable Stores Scope */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Store Applicability Scope
          </label>
          <div className="flex items-center gap-4 mb-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="storeScope"
                checked={storeScope === 'ALL'}
                onChange={() => {
                  setStoreScope('ALL');
                  setApplicableStoreIds([]);
                }}
                className="text-amber-600 focus:ring-amber-500"
              />
              All Platform Stores
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="storeScope"
                checked={storeScope === 'SPECIFIC'}
                onChange={() => setStoreScope('SPECIFIC')}
                className="text-amber-600 focus:ring-amber-500"
              />
              Specific / Selected Stores Only
            </label>
          </div>

          {storeScope === 'SPECIFIC' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto space-y-1.5 animate-in fade-in">
              {stores.map((st) => (
                <label
                  key={st.id}
                  className="flex items-center gap-2 text-xs text-slate-800 hover:bg-white p-1.5 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={applicableStoreIds.includes(st.id)}
                    onChange={() => handleToggleStoreSelection(st.id)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold">{st.name}</span>
                  <span className="text-slate-500 text-[11px]">({st.location})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button id="save-offer-btn" type="submit" size="sm" isLoading={isSubmitting}>
            {offerToEdit ? 'Save Changes' : 'Create Offer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
