import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Phone, MapPin, Building2, DoorClosed, Calendar, Save, LogOut, ShieldCheck, Sparkles, ShoppingBag } from 'lucide-react';

const HOSTEL_PRESETS = [
  'Boys Hostel B (Aryabhatta)',
  'Girls Hostel A (Gargi)',
  'Tagore International Hostel',
  'Green Valley PG Residency',
  'Campus Scholars PG',
  'Main Campus Faculty Quarter',
];

export const ProfileView: React.FC = () => {
  const { user, updateProfile, logout, openAuthModal, orders } = useApp();

  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [address, setAddress] = useState<string>(user?.address || '');
  const [hostelOrPg, setHostelOrPg] = useState<string>(user?.hostelOrPg || '');
  const [roomNumber, setRoomNumber] = useState<string>(user?.roomNumber || '');

  // Keep state synced if user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setAddress(user.address);
      setHostelOrPg(user.hostelOrPg || '');
      setRoomNumber(user.roomNumber || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="py-16 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
          Customer Profile
        </h2>
        <p className="text-xs text-stone-500 mt-2 mb-6">
          Sign in to save your campus hostel delivery address and view past orders.
        </p>
        <button
          onClick={() => openAuthModal()}
          className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      phone,
      address,
      hostelOrPg,
      roomNumber,
    });
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Active Student';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="w-20 h-20 rounded-3xl bg-amber-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-md font-['Outfit',sans-serif] shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
              {user.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              Verified Student
            </span>
          </div>

          <p className="text-xs text-stone-500 font-medium">{user.phone}</p>

          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-stone-400 pt-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Member since {formattedDate}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 py-2 px-3.5 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Total Orders</span>
          <span className="text-2xl font-extrabold text-stone-900 font-['Outfit',sans-serif] mt-1 block">
            {orders.length}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Primary Hostel</span>
          <span className="text-sm font-extrabold text-stone-900 truncate block mt-1">
            {user.hostelOrPg || 'Not Set'} {user.roomNumber ? `(Rm ${user.roomNumber})` : ''}
          </span>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-extrabold text-stone-900 font-['Outfit',sans-serif]">
              Delivery Details & Profile
            </h2>
            <p className="text-xs text-stone-500">Auto-filled at checkout for speedy ordering</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Primary Campus Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Hostel / PG Name (Optional)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={hostelOrPg}
                  onChange={(e) => setHostelOrPg(e.target.value)}
                  placeholder="e.g. Boys Hostel B"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Room Number (Optional)
              </label>
              <div className="relative">
                <DoorClosed className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 312"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Hostel selector preset buttons */}
          <div>
            <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
              Quick Select Campus Hostel:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {HOSTEL_PRESETS.map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHostelOrPg(h)}
                  className={`text-[11px] py-1 px-2.5 rounded-lg border transition-colors ${
                    hostelOrPg === h
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="py-3 px-6 bg-stone-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
