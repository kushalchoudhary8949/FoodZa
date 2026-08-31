import React, { useState, useEffect } from 'react';
import { Store, MenuItem, MenuCategory } from '../../types';
import { storeService } from '../../services/api/storeService';
import { menuService } from '../../services/api/menuService';
import { MenuItemModal } from './MenuItemModal';
import { CategoryModal } from './CategoryModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/common/Button';
import { Badge, VegNonVegBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  UtensilsCrossed,
  Store as StoreIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  ChevronRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react';

export const MenuManagementPage: React.FC<{ initialStoreId?: string }> = ({ initialStoreId }) => {
  const { success, error } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || '');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [dietFilter, setDietFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');

  // Item Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Category Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  const [isDeleteCatOpen, setIsDeleteCatOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<MenuCategory | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  // Load stores first
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storeList = await storeService.getStores();
        setStores(storeList);
        if (!selectedStoreId && storeList.length > 0) {
          setSelectedStoreId(storeList[0].id);
        }
      } catch {
        error('Failed to load stores');
      }
    };
    fetchStores();
  }, []);

  // Update selected store if prop changes
  useEffect(() => {
    if (initialStoreId) {
      setSelectedStoreId(initialStoreId);
    }
  }, [initialStoreId]);

  // Load menu for selected store
  const loadMenuData = async (storeId: string) => {
    if (!storeId) return;
    setIsLoading(true);
    try {
      const [cats, items] = await Promise.all([
        menuService.getCategoriesByStore(storeId),
        menuService.getMenuItemsByStore(storeId),
      ]);
      setCategories(cats);
      setMenuItems(items);
    } catch {
      error('Failed to load store menu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStoreId) {
      loadMenuData(selectedStoreId);
    }
  }, [selectedStoreId]);

  // Listen to db changes
  useEffect(() => {
    const handleDbChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (
        customEvent.detail?.key === 'foodfleet_menu_items' ||
        customEvent.detail?.key === 'foodfleet_categories'
      ) {
        if (selectedStoreId) {
          loadMenuData(selectedStoreId);
        }
      }
    };
    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, [selectedStoreId]);

  const handleToggleStock = async (item: MenuItem) => {
    try {
      const updated = await menuService.toggleAvailability(item.id);
      success(
        updated.isAvailable ? 'Item Available' : 'Item Out of Stock',
        `${item.name} is now ${updated.isAvailable ? 'in stock' : 'out of stock'}.`
      );
      if (selectedStoreId) loadMenuData(selectedStoreId);
    } catch (err: any) {
      error('Toggle Failed', err.message);
    }
  };

  const handleDeleteItemConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      await menuService.deleteMenuItem(itemToDelete.id);
      success('Item Removed', `${itemToDelete.name} was removed from menu.`);
      setIsDeleteItemOpen(false);
      setItemToDelete(null);
      if (selectedStoreId) loadMenuData(selectedStoreId);
    } catch (err: any) {
      error('Failed to delete item', err.message);
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleDeleteCatConfirm = async () => {
    if (!catToDelete) return;
    setIsDeletingCat(true);
    try {
      await menuService.deleteCategory(catToDelete.id);
      success('Category Removed', `Category "${catToDelete.name}" deleted.`);
      setIsDeleteCatOpen(false);
      setCatToDelete(null);
      if (selectedStoreId) loadMenuData(selectedStoreId);
    } catch (err: any) {
      error('Failed to delete category', err.message);
    } finally {
      setIsDeletingCat(false);
    }
  };

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  // Filtered Menu Items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryId === 'ALL' ? true : item.categoryId === selectedCategoryId;

    const matchesDiet =
      dietFilter === 'ALL'
        ? true
        : dietFilter === 'VEG'
        ? item.isVeg
        : !item.isVeg;

    return matchesSearch && matchesCategory && matchesDiet;
  });

  return (
    <div id="menu-management-page" className="space-y-5">
      {/* 1. Store Selector Bar - MANDATORY FIRST STEP */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Step 1: Select Store Outlet
            </span>
            <div className="flex items-center gap-2">
              <select
                id="select-active-store-dropdown"
                value={selectedStoreId}
                onChange={(e) => {
                  setSelectedStoreId(e.target.value);
                  setSelectedCategoryId('ALL');
                }}
                className="text-sm font-bold rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                {stores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.location})
                  </option>
                ))}
              </select>
              {selectedStore && (
                <Badge variant={selectedStore.status === 'Active' ? 'success' : 'danger'} dot size="sm">
                  {selectedStore.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            id="add-category-btn"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setIsCatModalOpen(true);
            }}
            leftIcon={<Layers className="w-3.5 h-3.5" />}
          >
            Add Category
          </Button>

          <Button
            id="add-menu-item-btn"
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Food Item
          </Button>
        </div>
      </div>

      {/* 2. Categories Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategoryId('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategoryId === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          All Items ({menuItems.length})
        </button>

        {categories.map((cat) => {
          const count = menuItems.filter((i) => i.categoryId === cat.id).length;
          const isSelected = selectedCategoryId === cat.id;
          return (
            <div
              key={cat.id}
              className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <button onClick={() => setSelectedCategoryId(cat.id)}>
                {cat.name} ({count})
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCategory(cat);
                  setIsCatModalOpen(true);
                }}
                className={`p-0.5 rounded hover:bg-black/10 transition-colors ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Edit Category"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCatToDelete(cat);
                  setIsDeleteCatOpen(true);
                }}
                className={`p-0.5 rounded hover:bg-black/10 transition-colors ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                }`}
                title="Delete Category"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. Search & Dietary Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-menu-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search dishes in ${selectedStore?.name || 'store'}...`}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setDietFilter('ALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              dietFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setDietFilter('VEG')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
              dietFilter === 'VEG' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
            }`}
          >
            <VegNonVegBadge isVeg={true} /> Veg
          </button>
          <button
            onClick={() => setDietFilter('NON_VEG')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
              dietFilter === 'NON_VEG' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600'
            }`}
          >
            <VegNonVegBadge isVeg={false} /> Non-Veg
          </button>
        </div>
      </div>

      {/* 4. Menu Items Grid */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={5} columns={4} />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No Dishes Found"
          description={`No menu items match your search or filter criteria in ${selectedStore?.name}.`}
          actionLabel="Add Food Item"
          onAction={() => {
            setEditingItem(null);
            setIsItemModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              id={`menu-item-card-${item.id}`}
              className={`bg-white rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                item.isAvailable ? 'border-slate-200/80' : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div>
                <div className="flex items-start gap-3 mb-2.5">
                  <img
                    src={item.image}
                    alt={item.name}
                    className={`w-20 h-20 rounded-xl object-cover border shrink-0 ${
                      item.isAvailable ? 'border-slate-200' : 'border-rose-200 grayscale opacity-80'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <VegNonVegBadge isVeg={item.isVeg} />
                        <h4 className="font-bold text-sm text-slate-900 leading-tight truncate">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      {item.categoryName}
                    </div>

                    <div className="mt-2 text-base font-extrabold text-amber-700">
                      ₹{item.price}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {item.description}
                </p>
              </div>

              {/* Stock Toggle & Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  id={`toggle-stock-${item.id}`}
                  onClick={() => handleToggleStock(item)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    item.isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100'
                  }`}
                  title="Toggle customer stock availability"
                >
                  {item.isAvailable ? '● In Stock' : '✕ Out of Stock'}
                </button>

                <div className="flex items-center gap-1">
                  <Button
                    id={`edit-item-${item.id}`}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingItem(item);
                      setIsItemModalOpen(true);
                    }}
                    className="text-xs px-2.5"
                  >
                    Edit
                  </Button>
                  <Button
                    id={`delete-item-${item.id}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setItemToDelete(item);
                      setIsDeleteItemOpen(true);
                    }}
                    className="text-xs px-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <MenuItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        storeId={selectedStoreId}
        categories={categories}
        itemToEdit={editingItem}
        onSuccess={() => loadMenuData(selectedStoreId)}
      />

      {/* Add / Edit Category Modal */}
      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        storeId={selectedStoreId}
        categoryToEdit={editingCategory}
        onSuccess={() => loadMenuData(selectedStoreId)}
      />

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteItemOpen}
        onClose={() => setIsDeleteItemOpen(false)}
        onConfirm={handleDeleteItemConfirm}
        title="Delete Food Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}" from this store's menu?`}
        confirmLabel="Delete Item"
        variant="danger"
        isLoading={isDeletingItem}
      />

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteCatOpen}
        onClose={() => setIsDeleteCatOpen(false)}
        onConfirm={handleDeleteCatConfirm}
        title="Delete Menu Category"
        message={`Are you sure you want to delete category "${catToDelete?.name}"? Items in this category will be unassigned.`}
        confirmLabel="Delete Category"
        variant="danger"
        isLoading={isDeletingCat}
      />
    </div>
  );
};
