import React from 'react';
import { useApp } from '../context/AppContext';
import { Store } from '../types';
import { Search, Star, Clock, MapPin, Sparkles, Filter, Leaf, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

const CUISINES = ['All', 'Burgers', 'Italian', 'Biryani', 'Healthy', 'Street Food'];

export const StoreList: React.FC = () => {
  const {
    stores,
    selectStore,
    searchQuery,
    setSearchQuery,
    selectedCuisine,
    setSelectedCuisine,
    vegOnlyFilter,
    setVegOnlyFilter,
    user,
    openAuthModal,
  } = useApp();

  // Filter stores based on search, cuisine, and veg-only
  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.tagline.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCuisine =
      selectedCuisine === 'All' ||
      store.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase());

    const matchesVeg = !vegOnlyFilter || store.isVegOnly;

    return matchesSearch && matchesCuisine && matchesVeg;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Student Welcome & Search Hero Banner */}
      <section className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Hostel & PG Express Food Delivery</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Outfit',sans-serif] leading-tight">
            {user ? `What are you craving, ${user.name.split(' ')[0]}?` : 'Hungry in your hostel room?'}
          </h1>
          <p className="text-amber-100 text-sm sm:text-base mt-2 font-medium max-w-lg">
            Pick a store below to browse its menu. Fast 20-30 min delivery straight to your campus gate or room.
          </p>

          {/* Quick Search Bar */}
          <div className="mt-5 relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stores, dishes, cuisines (e.g. KFC, Biryani, Chai)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-stone-900 placeholder-stone-400 text-sm font-medium shadow-md focus:outline-none focus:ring-4 focus:ring-amber-300/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-1 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </section>

      {/* Filter and Quick Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Cuisine Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CUISINES.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCuisine === cuisine
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>

        {/* Veg Only Toggle Switch */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              vegOnlyFilter
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5">
              <div className="w-full h-full rounded-full bg-emerald-600" />
            </div>
            <span>Pure Veg Only</span>
          </button>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
            Select a Food Store
          </h2>
          <p className="text-xs text-stone-500">
            {filteredStores.length} {filteredStores.length === 1 ? 'store' : 'stores'} open for delivery
          </p>
        </div>
      </div>

      {/* Stores Grid */}
      {filteredStores.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-stone-900 text-lg">No stores match your search</h3>
          <p className="text-stone-500 text-xs mt-1 mb-5">
            Try adjusting your search keywords or turning off the Pure Veg filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCuisine('All');
              setVegOnlyFilter(false);
            }}
            className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <motion.div
              key={store.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.15 }}
              onClick={() => selectStore(store)}
              className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col group"
            >
              {/* Store Image */}
              <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                <img
                  src={store.image}
                  alt={store.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  {store.isOpen ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
                      Open Now
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold shadow-xs">
                      Closed Currently
                    </span>
                  )}

                  {store.isVegOnly && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-xs flex items-center gap-1">
                      <Leaf className="w-3 h-3" />
                      100% Veg
                    </span>
                  )}
                </div>

                {/* Delivery Time Pill */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{store.deliveryTime}</span>
                </div>

                {/* Delivery Fee */}
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-xs font-semibold">
                  ₹{store.deliveryFee} fee
                </div>
              </div>

              {/* Store Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-stone-900 text-lg font-['Outfit',sans-serif] group-hover:text-amber-600 transition-colors">
                      {store.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-lg text-xs font-extrabold shrink-0">
                      <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                      <span>{store.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-stone-600 mt-1 line-clamp-1">
                    {store.cuisine}
                  </p>

                  <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                    {store.tagline}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-1 truncate max-w-[180px]">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{store.location}</span>
                  </div>

                  <span className="font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Menu <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
