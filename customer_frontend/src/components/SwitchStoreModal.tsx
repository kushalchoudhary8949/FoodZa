import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, ShoppingBag, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SwitchStoreModal: React.FC = () => {
  const { storeConflictModal, confirmStoreSwitch, cancelStoreSwitch } = useApp();

  if (!storeConflictModal?.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200"
        >
          <div className="flex items-center gap-3 text-amber-600 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-lg">Replace cart items?</h3>
              <p className="text-xs text-stone-500">Only 1 store allowed per order</p>
            </div>
          </div>

          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            Your cart already contains dishes from <strong className="text-stone-900">{storeConflictModal.currentStoreName}</strong>. 
            Adding <strong className="text-amber-700">{storeConflictModal.pendingItem?.name}</strong> will discard existing items and start a new order from <strong className="text-stone-900">{storeConflictModal.newStoreName}</strong>.
          </p>

          <div className="flex gap-3">
            <button
              onClick={cancelStoreSwitch}
              className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 font-semibold text-stone-700 text-sm hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmStoreSwitch}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 font-semibold text-white text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Discard & Add
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
