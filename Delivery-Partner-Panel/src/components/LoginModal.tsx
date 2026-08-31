import React, { useState } from 'react';
import { ShieldCheck, Lock, User, KeyRound, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import { PartnerProfile } from '../types';

interface LoginModalProps {
  onLoginSuccess: (partner: PartnerProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [partnerId, setPartnerId] = useState('DP-8821');
  const [password, setPassword] = useState('partner123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password states
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'ID' | 'VERIFY' | 'NEW_PASS' | 'DONE'>('ID');
  const [forgotId, setForgotId] = useState('DP-8821');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId.trim()) {
      setError('Please enter your Delivery Partner ID');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.login(partnerId.trim().toUpperCase(), password);
      onLoginSuccess(res.partner);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmitId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotId.trim()) {
      setForgotError('Please enter your Partner ID');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError(null);
      const res = await api.forgotPassword(forgotId.trim().toUpperCase());
      setForgotPhone(res.registeredPhone || 'your registered mobile');
      setForgotStep('VERIFY');
    } catch (err: any) {
      setForgotError(err.message || 'Partner ID not recognized');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 4) {
      setForgotError('Please enter the 4-digit verification code sent to your mobile (Demo code: 1234)');
      return;
    }
    setForgotError(null);
    setForgotStep('NEW_PASS');
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError(null);
      await api.forgotPassword(forgotId.trim().toUpperCase(), newPassword);
      setForgotStep('DONE');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div id="partner-login-view" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black mb-3 shadow-lg shadow-amber-500/25">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Delivery Partner</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Log in to manage orders, live GPS route, & payouts</p>
        </div>

        {error && (
          <div id="login-error-banner" className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
              Delivery Partner ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-partner-id"
                type="text"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value.toUpperCase())}
                placeholder="e.g. DP-8821"
                className="w-full pl-10 pr-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono font-bold transition"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                id="btn-forgot-password"
                onClick={() => {
                  setForgotId(partnerId || 'DP-8821');
                  setForgotStep('ID');
                  setForgotError(null);
                  setIsForgotOpen(true);
                }}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="btn-partner-login"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition active:scale-[0.99] cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>LOGIN TO DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Account Selector */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Demo Rider Accounts:</span>
            <span className="text-amber-400 font-mono text-[10px]">pass: partner123</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              id="demo-account-rahul"
              onClick={() => {
                setPartnerId('DP-8821');
                setPassword('partner123');
                setError(null);
              }}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                partnerId === 'DP-8821'
                  ? 'border-amber-400 bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/40'
                  : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-extrabold text-xs text-white">DP-8821</div>
              <div className="text-[10px] text-emerald-400 font-medium truncate">Rahul S. (Online)</div>
            </button>

            <button
              type="button"
              id="demo-account-vikas"
              onClick={() => {
                setPartnerId('DP-9042');
                setPassword('partner123');
                setError(null);
              }}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                partnerId === 'DP-9042'
                  ? 'border-amber-400 bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/40'
                  : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-extrabold text-xs text-white">DP-9042</div>
              <div className="text-[10px] text-slate-400 font-medium truncate">Vikas K. (Offline)</div>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div id="forgot-password-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-base">
                <KeyRound className="w-4 h-4" />
                <span>Reset Password</span>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="text-slate-500 hover:text-white text-xs px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 'ID' && (
              <form onSubmit={handleForgotSubmitId} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Enter your registered Partner ID to receive a verification OTP.
                </p>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Partner ID</label>
                  <input
                    type="text"
                    value={forgotId}
                    onChange={(e) => setForgotId(e.target.value.toUpperCase())}
                    placeholder="DP-8821"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {forgotLoading ? 'Verifying...' : 'Send Verification Code'}
                </button>
              </form>
            )}

            {forgotStep === 'VERIFY' && (
              <form onSubmit={handleVerifyForgotOtp} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Code sent to: <strong className="text-amber-400">{forgotPhone}</strong>. (Demo OTP: <span className="text-white font-mono">1234</span>)
                </p>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Enter 4-Digit Code</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="1234"
                    className="w-full text-center tracking-widest text-base font-mono px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Verify Code
                </button>
              </form>
            )}

            {forgotStep === 'NEW_PASS' && (
              <form onSubmit={handleSetNewPassword} className="space-y-3">
                <p className="text-xs text-slate-400">Set a new password for your account.</p>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {forgotLoading ? 'Updating...' : 'Set New Password'}
                </button>
              </form>
            )}

            {forgotStep === 'DONE' && (
              <div className="text-center py-3 space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Password Updated</h3>
                <p className="text-xs text-slate-400">
                  Your password has been changed. You can now login.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(newPassword);
                    setIsForgotOpen(false);
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

