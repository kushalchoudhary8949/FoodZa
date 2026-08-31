import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Order } from '../types';
import { orderService } from '../services/api/orderService';
import { useToast } from './ToastContext';
import { joinAdminRoom, subscribeToAdminTimeouts } from '../services/adminSocket';

interface InterventionContextType {
  pendingInterventions: Order[];
  isInterventionModalOpen: boolean;
  selectedInterventionOrder: Order | null;
  openInterventionModal: (order: Order) => void;
  closeInterventionModal: () => void;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason: string) => Promise<void>;
  simulateTimeout: () => Promise<void>;
  refreshInterventions: () => Promise<void>;
}

const InterventionContext = createContext<InterventionContextType | undefined>(undefined);

export const InterventionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingInterventions, setPendingInterventions] = useState<Order[]>([]);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [selectedInterventionOrder, setSelectedInterventionOrder] = useState<Order | null>(null);
  const { success, error, warning } = useToast();

  const refreshInterventions = useCallback(async () => {
    try {
      const orders = await orderService.getPendingInterventionOrders();
      setPendingInterventions(orders);
    } catch {
      // quiet fail
    }
  }, []);

  // Connect to Socket.IO Admin Room for real-time manager timeout alerts
  useEffect(() => {
    joinAdminRoom();
    refreshInterventions();

    const unsubTimeout = subscribeToAdminTimeouts((orderData) => {
      warning(
        '⏱ Manager Timeout Alert!',
        `Manager did not respond to Order #${orderData.orderId || orderData.id}. Escalated to Admin!`
      );
      refreshInterventions();
    });

    return () => {
      unsubTimeout();
    };
  }, [refreshInterventions, warning]);

  const openInterventionModal = useCallback((order: Order) => {
    setSelectedInterventionOrder(order);
    setIsInterventionModalOpen(true);
  }, []);

  const closeInterventionModal = useCallback(() => {
    setIsInterventionModalOpen(false);
    setSelectedInterventionOrder(null);
  }, []);

  const acceptOrder = useCallback(
    async (orderId: string) => {
      try {
        await orderService.adminAcceptTimeoutOrder(orderId);
        success('Order Accepted by Admin', `Order #${orderId} has been approved and routed for preparation.`);
        await refreshInterventions();
        closeInterventionModal();
      } catch (err: any) {
        error('Failed to Accept Order', err.message || 'An error occurred');
      }
    },
    [success, error, refreshInterventions, closeInterventionModal]
  );

  const rejectOrder = useCallback(
    async (orderId: string, reason: string) => {
      try {
        await orderService.adminRejectTimeoutOrder(orderId, reason);
        warning('Order Rejected by Admin', `Order #${orderId} was cancelled. Customer notified.`);
        await refreshInterventions();
        closeInterventionModal();
      } catch (err: any) {
        error('Failed to Reject Order', err.message || 'An error occurred');
      }
    },
    [warning, error, refreshInterventions, closeInterventionModal]
  );

  const simulateTimeout = useCallback(async () => {
    warning('Timeout Simulation', 'Real manager timeouts are handled automatically by BullMQ when managers fail to accept within 60s.');
  }, [warning]);

  return (
    <InterventionContext.Provider
      value={{
        pendingInterventions,
        isInterventionModalOpen,
        selectedInterventionOrder,
        openInterventionModal,
        closeInterventionModal,
        acceptOrder,
        rejectOrder,
        simulateTimeout,
        refreshInterventions,
      }}
    >
      {children}
    </InterventionContext.Provider>
  );
};

export const useIntervention = (): InterventionContextType => {
  const context = useContext(InterventionContext);
  if (!context) {
    throw new Error('useIntervention must be used within an InterventionProvider');
  }
  return context;
};
