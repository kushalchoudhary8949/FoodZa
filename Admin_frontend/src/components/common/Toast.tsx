import React from 'react';
import { useToast, ToastItem } from '../../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastMessage: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-200 bg-white shadow-emerald-500/5';
      case 'error':
        return 'border-rose-200 bg-white shadow-rose-500/5';
      case 'warning':
        return 'border-amber-200 bg-white shadow-amber-500/5';
      case 'info':
      default:
        return 'border-blue-200 bg-white shadow-blue-500/5';
    }
  };

  return (
    <div
      id={`toast-${toast.id}`}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${getBorderColor()}`}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 leading-tight">{toast.title}</h4>
        {toast.message && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        id={`toast-close-${toast.id}`}
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
