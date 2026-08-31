import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  Flame,
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [adminId, setAdminId] = useState('ADMIN100');
  const [password, setPassword] = useState('admin@pass2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId.trim()) {
      setError('Please enter your Admin ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    try {
      await login({ adminId, password });
    } catch (err: any) {
      setError(err.message || 'Invalid Admin ID or Password.');
    }
  };

  const handleFillDemo = (id: string) => {
    setAdminId(id);
    setPassword('admin@pass2026');
    setError(null);
  };

  return (
    <div
      id="admin-login-page"
      className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-600/30 mb-3 ring-4 ring-slate-800">
            <Flame className="w-8 h-8 fill-white text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            FoodFleet Admin
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
            Centralized Management & Operations Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-slate-800/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/80">
          {error && (
            <div
              id="login-error-alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Authentication Failed</span>
                <span className="text-rose-300/90">{error}</span>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Admin ID */}
            <div>
              <label
                htmlFor="admin-id"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Admin ID
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-id-input"
                  name="adminId"
                  type="text"
                  required
                  value={adminId}
                  onChange={(e) => {
                    setAdminId(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. ADMIN100"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  id="forgot-password-btn"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter administrator password"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div className="pt-2">
              <Button
                id="login-submit-btn"
                type="submit"
                size="lg"
                isLoading={isLoading}
                leftIcon={<ShieldCheck className="w-5 h-5" />}
                className="w-full font-bold shadow-lg shadow-amber-600/30"
              >
                Sign In to Admin Panel
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick Login Credentials:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="demo-admin100-btn"
                onClick={() => handleFillDemo('ADMIN100')}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-[11px] font-mono text-amber-300 border border-slate-600 transition-colors text-center"
              >
                ADMIN100
              </button>
              <button
                type="button"
                id="demo-root-btn"
                onClick={() => handleFillDemo('ROOT')}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-[11px] font-mono text-amber-300 border border-slate-600 transition-colors text-center"
              >
                ROOT
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-3">
              Frontend MVP • Central NestJS API + Firebase Auth ready
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
};
