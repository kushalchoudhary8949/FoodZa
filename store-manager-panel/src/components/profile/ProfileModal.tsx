import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  User,
  ShieldCheck,
  KeyRound,
  Store as StoreIcon,
  Phone,
  Mail,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Lock
} from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { currentManager, currentStore, logout } = useStoreManager();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  if (!currentManager || !currentStore) return null;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Store Manager Profile & Security</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Manager Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-black text-lg">
            {currentManager.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900">{currentManager.name}</h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                ACTIVE
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1 font-mono">
              <span>ID: {currentManager.id}</span>
              <span>•</span>
              <span>{currentManager.phone}</span>
            </div>
          </div>
        </div>

        {/* Store Isolation Certificate */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Store Access Authorization</span>
          </div>

          <div className="space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Assigned Store:</span>
              <strong className="text-slate-900">{currentStore.name}</strong>
            </div>
            <div className="flex justify-between">
              <span>Store ID:</span>
              <span className="font-mono text-slate-700">{currentStore.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="text-slate-700">{currentStore.locationArea}, {currentStore.city}</span>
            </div>
            <div className="flex justify-between">
              <span>Authorization Scope:</span>
              <span className="text-emerald-700 font-semibold">Store Manager (Full Local Scope)</span>
            </div>
          </div>
        </div>

        {/* Password Update Form */}
        <form onSubmit={handleChangePassword} className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>Update Account Password</span>
          </div>

          {pwError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {pwError}
            </div>
          )}

          {pwSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Password successfully changed!</span>
            </div>
          )}

          <div className="space-y-2 text-xs">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
            <input
              type="password"
              placeholder="New Password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-slate-200"
          >
            Update Password
          </button>
        </form>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
