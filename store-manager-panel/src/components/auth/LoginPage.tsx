import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import { Lock, User, KeyRound, ArrowRight, ShieldCheck, Store as StoreIcon, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, resetPassword, availableManagers, availableStores } = useStoreManager();

  const [managerId, setManagerId] = useState('MGR-KFC-101');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot Password Modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotManagerId, setForgotManagerId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await login(managerId, password);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (mgrId: string) => {
    setManagerId(mgrId);
    setPassword('password123');
    setErrorMessage('');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (forgotStep === 1) {
      if (!forgotManagerId.trim()) {
        setForgotError('Please enter your Store Manager ID or registered email.');
        return;
      }
      const mgr = availableManagers.find(
        (m) =>
          m.id.toLowerCase() === forgotManagerId.trim().toLowerCase() ||
          m.email.toLowerCase() === forgotManagerId.trim().toLowerCase()
      );
      if (!mgr) {
        setForgotError('Store Manager ID not found in system.');
        return;
      }
      setForgotStep(2);
      setOtpCode('8492'); // Auto-filled demo verification code for convenience
    } else if (forgotStep === 2) {
      if (otpCode !== '8492' && otpCode.length < 4) {
        setForgotError('Invalid verification code. Enter "8492" for this demo.');
        return;
      }
      setForgotStep(3);
    } else if (forgotStep === 3) {
      if (newPassword.length < 6) {
        setForgotError('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setForgotError('Passwords do not match.');
        return;
      }

      const res = await resetPassword(forgotManagerId, newPassword);
      if (res.success) {
        setForgotSuccess(res.message);
        setTimeout(() => {
          setIsForgotModalOpen(false);
          setForgotStep(1);
          setForgotSuccess('');
          setManagerId(forgotManagerId);
        }, 1800);
      } else {
        setForgotError(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
            <StoreIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Store Manager Panel</h2>
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Food Delivery Kitchen Ops</p>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-2">
          Secure portal for store managers to process live orders, manage menus, and track sales.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {errorMessage && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3.5 flex items-start gap-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="managerId" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Store Manager ID or Email
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 h-5 text-slate-400" />
                </div>
                <input
                  id="managerId"
                  name="managerId"
                  type="text"
                  required
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-sm font-semibold"
                  placeholder="e.g. MGR-KFC-101"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotManagerId(managerId);
                    setIsForgotModalOpen(true);
                    setForgotStep(1);
                    setForgotError('');
                  }}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="mt-1.5 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 h-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-sm font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-xs text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Login to Store Panel'}
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quick Demo Store Accounts
              </p>
            </div>
            <div className="space-y-2">
              {availableManagers.map((mgr) => {
                const store = availableStores.find((s) => s.id === mgr.storeId);
                const isSelected = managerId === mgr.id;
                return (
                  <button
                    key={mgr.id}
                    type="button"
                    onClick={() => handleQuickLogin(mgr.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{store?.name || mgr.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">ID: {mgr.id}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                      Select
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Multi-tenant Isolation: Managers only access their assigned store.</span>
        </div>
      </div>

      {/* Secure Forgot Password Modal Flow */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-sm p-1 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reset Store Password</h3>
                <p className="text-xs text-slate-500">Step {forgotStep} of 3 • Secure Verification Flow</p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              {forgotStep === 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Store Manager ID or Registered Email
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotManagerId}
                    onChange={(e) => setForgotManagerId(e.target.value)}
                    placeholder="e.g. MGR-KFC-101"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    We will dispatch a 4-digit verification code to your registered store device.
                  </p>
                </div>
              )}

              {forgotStep === 2 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Enter Verification OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 8492"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-lg tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    Demo OTP code <strong>8492</strong> has been auto-provided.
                  </p>
                </div>
              )}

              {forgotStep === 3 && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {forgotStep === 1 && 'Send Reset Code'}
                  {forgotStep === 2 && 'Verify Code'}
                  {forgotStep === 3 && 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
