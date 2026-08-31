import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  Store as StoreIcon,
  Clock,
  Phone,
  MapPin,
  Image,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Info,
  Power
} from 'lucide-react';
import { Store } from '../../types';

export const ManageStoreView: React.FC = () => {
  const { currentStore, updateStoreDetails, toggleStoreStatus } = useStoreManager();

  if (!currentStore) return null;

  // Editable form state
  const [storeName, setStoreName] = useState(currentStore.name);
  const [description, setDescription] = useState(currentStore.description);
  const [tagline, setTagline] = useState(currentStore.tagline);
  const [logoUrl, setLogoUrl] = useState(currentStore.logo);
  const [bannerUrl, setBannerUrl] = useState(currentStore.bannerImage);
  const [contactNumber, setContactNumber] = useState(currentStore.contactNumber);
  const [email, setEmail] = useState(currentStore.email);
  const [address, setAddress] = useState(currentStore.address);
  const [locationArea, setLocationArea] = useState(currentStore.locationArea);
  const [city, setCity] = useState(currentStore.city);
  const [openingTime, setOpeningTime] = useState(currentStore.openingTime);
  const [closingTime, setClosingTime] = useState(currentStore.closingTime);
  const [defaultPrepTime, setDefaultPrepTime] = useState(currentStore.defaultPrepTimeMinutes);
  const [defaultTimeout, setDefaultTimeout] = useState(currentStore.defaultTimeoutSeconds);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    updateStoreDetails({
      name: storeName,
      description,
      tagline,
      logo: logoUrl,
      bannerImage: bannerUrl,
      contactNumber,
      email,
      address,
      locationArea,
      city,
      openingTime,
      closingTime,
      defaultPrepTimeMinutes: Number(defaultPrepTime),
      defaultTimeoutSeconds: Number(defaultTimeout),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manage Store Information
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Update operational details, business hours, and contact information for {currentStore.name}.
          </p>
        </div>

        {/* Prominent Open / Closed Status Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Store Status
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {currentStore.isOpen ? 'Accepting Orders' : 'Store Offline'}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleStoreStatus}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-xs ${
              currentStore.isOpen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${currentStore.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{currentStore.isOpen ? '🟢 OPEN' : '⚫ CLOSED'}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Store details saved successfully! All customer-facing endpoints updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Basic Store Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <StoreIcon className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Store Profile & Branding
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Store Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Logo / Avatar Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
                <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Store Banner URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
                <img src={bannerUrl} alt="Banner" className="w-14 h-9 rounded-lg object-cover border border-slate-200" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Operational Hours & Location */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Operating Hours, Timers & Location
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Opening Time
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Closing Time
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Order Popup Timeout
              </label>
              <select
                value={defaultTimeout}
                onChange={(e) => setDefaultTimeout(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white"
              >
                <option value={30}>30 Seconds</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds (Standard)</option>
                <option value={90}>90 Seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Default Kitchen Prep Time
              </label>
              <input
                type="number"
                min={5}
                max={90}
                value={defaultPrepTime}
                onChange={(e) => setDefaultPrepTime(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Contact Phone *
              </label>
              <input
                type="text"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Location Area *
              </label>
              <input
                type="text"
                required
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* 3. Protected / Locked Admin Settings (Explicitly Enforced) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Protected Central Admin Settings (Read-Only)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Locked by Platform Security Rules
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Store managers are strictly forbidden from modifying legal ownership, platform commission rates, or other stores' configurations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Store ID</span>
              <span className="text-xs font-mono font-bold text-slate-800">{currentStore.id}</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Ownership Entity</span>
              <span className="text-xs font-semibold text-slate-800">{currentStore.ownerName}</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Platform Commission</span>
              <span className="text-xs font-mono font-bold text-amber-600">{currentStore.commissionPercentage}%</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">GSTIN & FSSAI</span>
              <span className="text-[11px] font-mono text-slate-600">{currentStore.gstin}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>[ SAVE CHANGES ]</span>
          </button>
        </div>
      </form>
    </div>
  );
};
