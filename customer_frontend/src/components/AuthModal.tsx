import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Smartphone, User, MapPin, Building2, DoorClosed, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const HOSTEL_PRESETS = [
  'Boys Hostel B (Aryabhatta)',
  'Girls Hostel A (Gargi)',
  'Tagore International Hostel',
  'Green Valley PG Residency',
  'Campus Scholars PG',
];

export const AuthModal: React.FC = () => {
  const { isAuthOpen, closeAuthModal, login, signup } = useApp();
  const [authMode, setAuthMode] = useState<'otp' | 'signup'>('otp');

  // Form states
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [otpCode, setOtpCode] = useState<string>('4082');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);

  // Signup states
  const [name, setName] = useState<string>('');
  const [signupPhone, setSignupPhone] = useState<string>('+91 ');
  const [address, setAddress] = useState<string>('');
  const [hostelOrPg, setHostelOrPg] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('');

  if (!isAuthOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setIsOtpSent(true);
  };

  const handleOtpLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(phone, otpCode);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !signupPhone.trim() || !address.trim()) return;
    signup({
      name,
      phone: signupPhone,
      address,
      hostelOrPg,
      roomNumber,
    });
  };

  const handleQuickDemoLogin = () => {
    login('+91 98765 43210', '4082');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 relative my-8"
        >
          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-white shadow-md mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight font-['Outfit',sans-serif]">
              {authMode === 'signup' ? 'Create Customer Profile' : 'Welcome to QuickBite'}
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              {authMode === 'signup'
                ? 'Join to order meals directly to your hostel or room'
                : 'Enter your phone number for passwordless OTP sign-in'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl mb-6 text-xs font-semibold">
            <button
              onClick={() => {
                setAuthMode('otp');
                setIsOtpSent(false);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                authMode === 'otp' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Phone OTP Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                authMode === 'signup' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              New Student? Sign Up
            </button>
          </div>

          {/* Mode: OTP */}
          {authMode === 'otp' && (
            <div>
              {!isOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Smartphone className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 text-stone-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <p className="text-xs text-stone-400 mt-1">We will send a 4-digit verification code</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Get OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpLogin} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        Enter 4-digit OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsOtpSent(false)}
                        className="text-xs font-semibold text-amber-600 hover:underline cursor-pointer"
                      >
                        Change Number
                      </button>
                    </div>
                    <div className="relative">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="4082"
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 text-stone-900 text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <p className="text-xs text-emerald-600 mt-1 font-medium">Auto-filled verification code: 4082</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Mode: Sign Up */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohan Verma"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98765 12345"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Delivery Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder="e.g. North Campus, Block 3, near Gate 1"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Hostel / PG Name <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={hostelOrPg}
                      onChange={(e) => setHostelOrPg(e.target.value)}
                      placeholder="e.g. Hostel B"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Room Number <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <DoorClosed className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. 204"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quick hostel presets */}
              <div>
                <span className="text-[11px] font-semibold text-stone-500 block mb-1">Quick Select Hostel/PG:</span>
                <div className="flex flex-wrap gap-1.5">
                  {HOSTEL_PRESETS.slice(0, 3).map((h) => (
                    <button
                      type="button"
                      key={h}
                      onClick={() => setHostelOrPg(h)}
                      className="text-[11px] py-1 px-2 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Create Profile & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Student Login shortcut */}
          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <button
              onClick={handleQuickDemoLogin}
              type="button"
              className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition-colors border border-amber-200/70 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>1-Click Student Demo Login (Aarav Sharma)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
