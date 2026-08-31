import { isValidTransition } from '../src/orders/order-state-machine';
import { OrderStatus } from '@prisma/client';

describe('Order State Machine & Business Logic (Unit/E2E)', () => {
  describe('Order State Machine Rules', () => {
    it('should allow valid transitions from WAITING_FOR_MANAGER', () => {
      expect(isValidTransition(OrderStatus.WAITING_FOR_MANAGER, OrderStatus.MANAGER_ACCEPTED)).toBe(true);
      expect(isValidTransition(OrderStatus.WAITING_FOR_MANAGER, OrderStatus.MANAGER_REJECTED)).toBe(true);
      expect(isValidTransition(OrderStatus.WAITING_FOR_MANAGER, OrderStatus.MANAGER_TIMEOUT)).toBe(true);
    });

    it('should reject invalid transitions from WAITING_FOR_MANAGER', () => {
      expect(isValidTransition(OrderStatus.WAITING_FOR_MANAGER, OrderStatus.DELIVERED)).toBe(false);
      expect(isValidTransition(OrderStatus.WAITING_FOR_MANAGER, OrderStatus.PREPARING)).toBe(false);
      expect(isValidTransition(OrderStatus.WAITING_FOR_MANAGER, OrderStatus.PICKED_UP)).toBe(false);
    });

    it('should enforce manager timeout escalation to admin', () => {
      expect(isValidTransition(OrderStatus.MANAGER_TIMEOUT, OrderStatus.WAITING_FOR_ADMIN)).toBe(true);
      expect(isValidTransition(OrderStatus.WAITING_FOR_ADMIN, OrderStatus.ADMIN_ACCEPTED)).toBe(true);
      expect(isValidTransition(OrderStatus.WAITING_FOR_ADMIN, OrderStatus.ADMIN_REJECTED)).toBe(true);
    });

    it('should enforce full happy path lifecycle', () => {
      expect(isValidTransition(OrderStatus.WAITING_FOR_MANAGER, OrderStatus.MANAGER_ACCEPTED)).toBe(true);
      expect(isValidTransition(OrderStatus.MANAGER_ACCEPTED, OrderStatus.PREPARING)).toBe(true);
      expect(isValidTransition(OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP)).toBe(true);
      expect(isValidTransition(OrderStatus.READY_FOR_PICKUP, OrderStatus.WAITING_FOR_PARTNER)).toBe(true);
      expect(isValidTransition(OrderStatus.WAITING_FOR_PARTNER, OrderStatus.DELIVERY_ASSIGNED)).toBe(true);
      expect(isValidTransition(OrderStatus.DELIVERY_ASSIGNED, OrderStatus.PICKED_UP)).toBe(true);
      expect(isValidTransition(OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY)).toBe(true);
      expect(isValidTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED)).toBe(true);
    });
  });
});
