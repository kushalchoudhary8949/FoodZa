import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { MenuCategory } from '../../types';
import { menuService } from '../../services/api/menuService';
import { useToast } from '../../context/ToastContext';
import { Layers } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  categoryToEdit?: MenuCategory | null;
  onSuccess: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  storeId,
  categoryToEdit,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setDescription(categoryToEdit.description || '');
      } else {
        setName('');
        setDescription('');
      }
    }
  }, [isOpen, categoryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Validation Error', 'Category name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        await menuService.updateCategory({
          id: categoryToEdit.id,
          storeId,
          name,
          description,
        });
        success('Category Updated', `Category "${name}" was updated.`);
      } else {
        await menuService.createCategory({
          storeId,
          name,
          description,
        });
        success('Category Created', `Category "${name}" added to menu.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to save category', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? `Edit Category: ${categoryToEdit.name}` : 'Add Menu Category'}
      subtitle="Organize dishes and drinks into structured categories"
      maxWidth="sm"
      id="category-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Category Name *
          </label>
          <input
            id="category-name-input"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Burgers, Beverages, Desserts"
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="category-desc-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief note about this category..."
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button id="save-category-btn" type="submit" size="sm" isLoading={isSubmitting}>
            {categoryToEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
