import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Store, MenuItem } from '../types';
import { ArrowLeft, Star, Clock, MapPin, Search, Plus, Minus, ShoppingBag, Leaf, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface StoreMenuProps {
  store: Store;
}

export const StoreMenu: React.FC<StoreMenuProps> = ({ store }) => {
  const {
    selectStore,
    menuItems,
    cart,
    addToCart,
    updateQuantity,
    cartTotalCount,
    cartTotal,
    setCurrentTab,
  } = useApp();

  const [menuSearch, setMenuSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [vegOnly, setVegOnly] = useState<boolean>(false);

  // Filter items specifically belonging to THIS selected store
  const storeItems = menuItems.filter((item) => item.storeId === store.id);

  // Get unique categories for this store
  const categories = ['All', ...Array.from(new Set(storeItems.map((item) => item.category)))];

  // Apply filters
  const filteredItems = storeItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesVeg = !vegOnly || item.isVeg;
    return matchesSearch && matchesCategory && matchesVeg;
  });

  // Group items by category if "All" is selected, or single category
  const groupedCategories =
    selectedCategory === 'All'
      ? Array.from(new Set(filteredItems.map((item) => item.category)))
      : [selectedCategory];

  // Helper to get cart quantity for an item
  const getItemCartQuantity = (itemId: string): number => {
    const found = cart.items.find((ci) => ci.item.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => selectStore(null)}
          className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-xs py-2 px-3 rounded-xl bg-white border border-stone-200 shadow-xs hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Stores</span>
        </button>
        <span className="text-xs text-stone-400 font-semibold">Store Menu</span>
      </div>

      {/* Store Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm overflow-hidden relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img
            src={store.image}
            alt={store.name}
            referrerPolicy="no-referrer"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-stone-200 shadow-sm shrink-0"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
                {store.name}
              </h1>
              {store.isVegOnly && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                  <Leaf className="w-3 h-3" /> Pure Veg
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-stone-600 mt-1">{store.cuisine}</p>
            <p className="text-xs text-stone-400 mt-0.5">{store.tagline}</p>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-lg font-bold">
                <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>{store.rating} ({store.totalRatings}+ ratings)</span>
              </div>
              <div className="flex items-center gap-1 text-stone-600 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{store.deliveryTime}</span>
              </div>
              <div className="flex items-center gap-1 text-stone-500">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{store.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Filters and Search */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs space-y-3 sticky top-18 z-30 backdrop-blur-md bg-white/95">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Search inside menu */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder={`Search in ${store.name}'s menu...`}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Veg Only Toggle */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 ${
              vegOnly
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <div className="w-3 h-3 rounded-xs border border-emerald-600 flex items-center justify-center p-0.5">
              <div className="w-full h-full rounded-full bg-emerald-600" />
            </div>
            <span>Veg Only</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Categories and Dishes */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200">
          <p className="font-bold text-stone-800 text-sm">No items found matching your filters</p>
          <button
            onClick={() => {
              setMenuSearch('');
              setSelectedCategory('All');
              setVegOnly(false);
            }}
            className="mt-3 text-xs text-amber-600 font-bold hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedCategories.map((category) => {
            const catItems = filteredItems.filter((i) => i.category === category);
            if (catItems.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h2 className="text-lg font-extrabold text-stone-900 font-['Outfit',sans-serif] tracking-tight">
                    {category} <span className="text-xs text-stone-400 font-semibold font-sans">({catItems.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catItems.map((item) => {
                    const quantity = getItemCartQuantity(item.id);

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex justify-between gap-4 hover:border-stone-300 transition-all group"
                      >
                        {/* Item Details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            {/* Veg / Non-Veg Indicator Dot */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <div
                                className={`w-4 h-4 rounded-xs border flex items-center justify-center p-0.5 ${
                                  item.isVeg ? 'border-emerald-600' : 'border-rose-700'
                                }`}
                              >
                                {item.isVeg ? (
                                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                                ) : (
                                  <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-700" />
                                )}
                              </div>
                              {item.isPopular && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-sm">
                                  Bestseller
                                </span>
                              )}
                            </div>

                            {/* Title & Price */}
                            <h3 className="font-bold text-stone-900 text-sm group-hover:text-amber-600 transition-colors">
                              {item.name}
                            </h3>
                            <div className="text-sm font-extrabold text-stone-900 mt-1">
                              ₹{item.price}
                            </div>

                            {/* Description */}
                            <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Item Photo & Add Button */}
                        <div className="relative flex flex-col items-center shrink-0 w-28">
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-28 h-24 rounded-xl object-cover border border-stone-100 shadow-xs"
                          />

                          {/* Add / Quantity Button */}
                          <div className="absolute -bottom-2">
                            {quantity === 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                className="py-1.5 px-6 rounded-xl bg-white border border-stone-200 shadow-md text-emerald-700 hover:bg-emerald-50 active:scale-95 font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1"
                              >
                                <span>ADD</span>
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            ) : (
                              <div className="flex items-center bg-emerald-700 text-white rounded-xl shadow-md overflow-hidden border border-emerald-800">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="p-1.5 hover:bg-emerald-800 transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2.5 text-xs font-extrabold">{quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="p-1.5 hover:bg-emerald-800 transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Cart Bar if items exist */}
      {cartTotalCount > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md sm:w-full z-40"
        >
          <button
            onClick={() => setCurrentTab('cart')}
            className="w-full py-3.5 px-5 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold shadow-2xl flex items-center justify-between border border-stone-800 transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-extrabold text-xs">
                {cartTotalCount}
              </div>
              <div>
                <div className="text-xs text-stone-300 font-medium">Total: ₹{cartTotal}</div>
                <div className="text-xs text-emerald-400 font-bold">Extra items added</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-extrabold text-amber-400">
              <span>View Cart</span>
              <ShoppingBag className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
};
