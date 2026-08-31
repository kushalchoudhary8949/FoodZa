import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  Search,
  Filter,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { FoodItem, MenuCategory } from '../../types';

export const MenuManagementView: React.FC = () => {
  const {
    currentStore,
    foodItems,
    categories,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    toggleItemAvailability,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useStoreManager();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dietFilter, setDietFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState(129);
  const [itemCategory, setItemCategory] = useState(categories[0]?.name || 'Burgers');
  const [itemIsVeg, setItemIsVeg] = useState(false);
  const [itemIsAvailable, setItemIsAvailable] = useState(true);
  const [itemImage, setItemImage] = useState('');
  const [itemPrepTime, setItemPrepTime] = useState(12);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  if (!currentStore) return null;

  // Preset food images for quick item creation
  const presetFoodImages = [
    { label: 'Chicken Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80' },
    { label: 'Crispy Veg Burger', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80' },
    { label: 'Fried Chicken Bucket', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80' },
    { label: 'Pizza Farmhouse', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80' },
    { label: 'French Fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80' },
    { label: 'Chilled Pepsi / Cola', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80' },
    { label: 'Choco Lava Cake', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80' },
  ];

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemDesc('');
    setItemPrice(99);
    setItemCategory(categories[0]?.name || 'Burgers');
    setItemIsVeg(false);
    setItemIsAvailable(true);
    setItemImage(presetFoodImages[0].url);
    setItemPrepTime(12);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: FoodItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(item.price);
    setItemCategory(item.category);
    setItemIsVeg(item.isVeg);
    setItemIsAvailable(item.isAvailable);
    setItemImage(item.image);
    setItemPrepTime(item.preparationTimeMinutes);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    if (editingItem) {
      updateFoodItem(editingItem.id, {
        name: itemName,
        description: itemDesc,
        price: Number(itemPrice),
        category: itemCategory,
        isVeg: itemIsVeg,
        isAvailable: itemIsAvailable,
        image: itemImage || presetFoodImages[0].url,
        preparationTimeMinutes: Number(itemPrepTime),
      });
    } else {
      addFoodItem({
        name: itemName,
        description: itemDesc,
        price: Number(itemPrice),
        category: itemCategory,
        isVeg: itemIsVeg,
        isAvailable: itemIsAvailable,
        image: itemImage || presetFoodImages[0].url,
        preparationTimeMinutes: Number(itemPrepTime),
      });
    }

    setIsItemModalOpen(false);
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDesc('');
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryName, categoryDesc);
    } else {
      addCategory(categoryName, categoryDesc);
    }
    setIsCatModalOpen(false);
  };

  // Filter items
  const filteredFoodItems = foodItems.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (dietFilter === 'VEG' && !item.isVeg) return false;
    if (dietFilter === 'NON_VEG' && item.isVeg) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {currentStore.name} Menu
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {foodItems.length} items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage food catalog, categories, pricing, and live kitchen availability for your store.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleOpenAddCategory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Manage Categories</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddItem}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>+ ADD ITEM</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Filter Toolbar */}
      <div className="space-y-3">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Items ({foodItems.length})
          </button>

          {categories.map((cat) => {
            const count = foodItems.filter((i) => i.category === cat.name).length;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter bar: Search & Veg Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white border border-slate-200 p-2.5 rounded-2xl shadow-xs">
          {/* Veg/Non-Veg Filter */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDietFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                dietFilter === 'ALL' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Diets
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('VEG')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                dietFilter === 'VEG' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Veg Only
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('NON_VEG')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                dietFilter === 'NON_VEG' ? 'bg-red-50 text-red-800 border border-red-200 font-bold' : 'text-slate-500 hover:text-red-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Non-Veg Only
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish or ingredient..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Food Items Grid (Exact layout style specified in prompt section 10) */}
      {filteredFoodItems.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No items found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try choosing a different category or add a new food item to your store menu.
          </p>
          <button
            onClick={handleOpenAddItem}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            + ADD ITEM
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFoodItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                item.isAvailable
                  ? 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  : 'border-slate-200 opacity-75 bg-slate-50'
              }`}
            >
              <div>
                {/* Item Image with Badges */}
                <div className="h-40 relative bg-slate-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Category Pill */}
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-sm text-slate-800 border border-slate-200 shadow-xs">
                    {item.category}
                  </span>

                  {/* Veg / Non-Veg Indicator */}
                  <span
                    className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-md flex items-center justify-center border ${
                      item.isVeg
                        ? 'bg-white border-emerald-500 text-emerald-600 shadow-xs'
                        : 'bg-white border-red-500 text-red-600 shadow-xs'
                    }`}
                    title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </span>

                  {/* Out of Stock Overlay Ribbon */}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-sm">
                        Disabled / Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Container */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {item.name}
                    </h3>
                    <span className="font-mono font-black text-base text-emerald-600 shrink-0">
                      ₹{item.price}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.preparationTimeMinutes} mins prep</span>
                    </span>

                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        item.isAvailable ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {item.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Disabled</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: [Edit] [Disable/Enable] [Delete] */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEditItem(item)}
                  className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleItemAvailability(item.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    item.isAvailable
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {item.isAvailable ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{item.isAvailable ? 'Disable' : 'Enable'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                      deleteFoodItem(item.id);
                    }
                  }}
                  className="py-1.5 px-2 rounded-lg bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-300 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Food Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Chicken Zinger Burger"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Describe ingredients, taste, and portion size..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Dietary Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setItemIsVeg(true)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                        itemIsVeg
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      🟢 Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemIsVeg(false)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                        !itemIsVeg
                          ? 'bg-red-50 border-red-500 text-red-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      🔴 Non-Veg
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Est. Prep Time (Mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={itemPrepTime}
                    onChange={(e) => setItemPrepTime(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Preset Image Chooser */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Item Image URL (Choose preset or enter custom)
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {presetFoodImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setItemImage(img.url)}
                      className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 cursor-pointer transition-all ${
                        itemImage === img.url ? 'border-amber-500 scale-105 shadow-sm' : 'border-slate-200 opacity-60'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={itemImage}
                  onChange={(e) => setItemImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs mt-1 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availabilityToggle"
                  checked={itemIsAvailable}
                  onChange={(e) => setItemIsAvailable(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="availabilityToggle" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Item is immediately available for ordering in kitchen
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Save Item Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCategory ? 'Edit Menu Category' : 'Add Menu Category'}
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Buckets, Beverages, Combos..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Category Description
                </label>
                <input
                  type="text"
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  placeholder="Short tagline for category"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>

            {/* List of existing categories with Delete action */}
            <div className="pt-4 border-t border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Existing Categories ({categories.length})
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCategory(cat)}
                        className="text-amber-700 font-medium hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete category ${cat.name}?`)) {
                            deleteCategory(cat.id);
                          }
                        }}
                        className="text-red-600 font-medium hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
