import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { MenuItem, MenuCategory } from '../../types';
import { menuService } from '../../services/api/menuService';
import { useToast } from '../../context/ToastContext';
import { VegNonVegBadge } from '../../components/common/Badge';
import { Utensils, IndianRupee, Image, Tag } from 'lucide-react';

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  categories: MenuCategory[];
  itemToEdit?: MenuItem | null;
  onSuccess: () => void;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  storeId,
  categories,
  itemToEdit,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number | string>(199);
  const [isVeg, setIsVeg] = useState(false);
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setName(itemToEdit.name);
        setCategoryId(itemToEdit.categoryId);
        setPrice(itemToEdit.price);
        setIsVeg(itemToEdit.isVeg);
        setImage(itemToEdit.image);
        setDescription(itemToEdit.description);
        setIsAvailable(itemToEdit.isAvailable);
      } else {
        setName('');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setPrice(199);
        setIsVeg(true);
        setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80');
        setDescription('');
        setIsAvailable(true);
      }
    }
  }, [isOpen, itemToEdit, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || Number(price) <= 0) {
      error('Validation Error', 'Please provide a valid item name, category, and price.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (itemToEdit) {
        await menuService.updateMenuItem({
          id: itemToEdit.id,
          storeId,
          name,
          categoryId,
          price: Number(price),
          isVeg,
          image,
          description,
          isAvailable,
        });
        success('Menu Item Updated', `${name} details updated.`);
      } else {
        await menuService.createMenuItem({
          storeId,
          name,
          categoryId,
          price: Number(price),
          isVeg,
          image,
          description,
          isAvailable,
        });
        success('Menu Item Added', `${name} was added to the menu.`);
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
      title={itemToEdit ? `Edit Dish: ${itemToEdit.name}` : 'Add New Menu Dish'}
      subtitle="Configure item name, pricing, veg/non-veg classification, and photos"
      maxWidth="lg"
      id="menu-item-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Name & Dietary Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Food Item Name *
            </label>
            <input
              id="menu-item-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zinger Burger, Paneer Tikka"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Dietary Type
            </label>
            <div className="flex items-center gap-2 pt-1.5">
              <button
                type="button"
                id="type-veg-btn"
                onClick={() => setIsVeg(true)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  isVeg
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <VegNonVegBadge isVeg={true} /> Veg
              </button>
              <button
                type="button"
                id="type-nonveg-btn"
                onClick={() => setIsVeg(false)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  !isVeg
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <VegNonVegBadge isVeg={false} /> Non-Veg
              </button>
            </div>
          </div>
        </div>

        {/* Category & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Menu Category *
            </label>
            <select
              id="menu-item-category-select"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Price (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                id="menu-item-price-input"
                type="number"
                min="1"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="249"
                className="w-full text-sm font-bold pl-7 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Food Item Image URL
          </label>
          <input
            id="menu-item-image-input"
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="menu-item-desc-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Fresh crispy chicken patty topped with fresh lettuce and signature mayo sauce..."
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Stock Availability</span>
            <span className="text-[11px] text-slate-500">
              {isAvailable ? 'Customers can order this item' : 'Marked as Out of Stock in Customer App'}
            </span>
          </div>
          <button
            type="button"
            id="menu-item-toggle-stock"
            onClick={() => setIsAvailable(!isAvailable)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isAvailable
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            {isAvailable ? 'In Stock (Available)' : 'Out of Stock'}
          </button>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button id="save-menu-item-btn" type="submit" size="sm" isLoading={isSubmitting}>
            {itemToEdit ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
