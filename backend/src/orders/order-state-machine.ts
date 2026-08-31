import { OrderStatus } from '@prisma/client';

/**
 * Strict order state machine.
 * Maps each status to its allowed next statuses.
 * Any transition not in this map is REJECTED.
 */
const STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  WAITING_FOR_MANAGER: [
    OrderStatus.MANAGER_ACCEPTED,
    OrderStatus.MANAGER_REJECTED,
    OrderStatus.MANAGER_TIMEOUT,
  ],
  MANAGER_ACCEPTED: [OrderStatus.PREPARING],
  MANAGER_REJECTED: [OrderStatus.CANCELLED],
  MANAGER_TIMEOUT: [OrderStatus.WAITING_FOR_ADMIN],
  WAITING_FOR_ADMIN: [OrderStatus.ADMIN_ACCEPTED, OrderStatus.ADMIN_REJECTED],
  ADMIN_ACCEPTED: [OrderStatus.PREPARING],
  ADMIN_REJECTED: [OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY_FOR_PICKUP],
  READY_FOR_PICKUP: [OrderStatus.WAITING_FOR_PARTNER],
  WAITING_FOR_PARTNER: [OrderStatus.DELIVERY_ASSIGNED],
  DELIVERY_ASSIGNED: [
    OrderStatus.PICKED_UP,
    // Partner rejection sends order back to WAITING_FOR_PARTNER
    // This is handled via DeliveryRequest, not a direct order status change
  ],
  PICKED_UP: [OrderStatus.OUT_FOR_DELIVERY],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * Returns true if transitioning from `current` to `next` is valid.
 */
export function isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
  const allowed = STATE_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}

/**
 * Returns the list of allowed next statuses for the current status.
 */
export function getAllowedTransitions(current: OrderStatus): OrderStatus[] {
  return STATE_TRANSITIONS[current] || [];
}

/**
 * Terminal states — orders in these states cannot transition further.
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED;
}
