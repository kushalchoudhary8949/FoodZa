import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { forgotPassword } = useAuth();
  const [adminIdOrEmail, setAdminIdOrEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminIdOrEmail.trim()) {
      setErrorMessage('Please enter your Admin ID or registered Email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await forgotPassword(adminIdOrEmail);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setAdminIdOrEmail('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Admin Password Recovery"
      subtitle="Reset credentials via registered administrator email"
      maxWidth="md"
      id="forgot-password-modal"
    >
      {successMessage ? (
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900">Recovery Instructions Dispatched</h4>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            {successMessage}
          </p>
          <Button onClick={handleClose} className="w-full mt-2" size="sm">
            Back to Admin Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admin ID or Registered Email
            </label>
            <div className="relative">
              <input
                id="forgot-admin-input"
                type="text"
                value={adminIdOrEmail}
                onChange={(e) => setAdminIdOrEmail(e.target.value)}
                placeholder="e.g. ADMIN100 or admin@foodfleet.internal"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Authentication will later connect with Firebase Authentication & central NestJS backend.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              id="submit-forgot-password-btn"
              type="submit"
              size="sm"
              isLoading={isLoading}
              leftIcon={<Mail className="w-4 h-4" />}
            >
              Send Reset Link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
