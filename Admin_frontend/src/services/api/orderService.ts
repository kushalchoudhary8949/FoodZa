import { Order, OrderStatus } from '../../types';
import { AdminApiClient } from '../adminApi';
import { db } from '../storage';

export interface OrderFilterParams {
  search?: string;
  status?: OrderStatus | 'ALL';
  storeId?: string | 'ALL';
  deliveryPartnerId?: string | 'ALL';
  paymentMethod?: string | 'ALL';
  dateFilter?: 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
}

export const orderService = {
  async getOrders(params?: OrderFilterParams): Promise<Order[]> {
    try {
      const backendOrders: any[] = await AdminApiClient.getAllOrders({
        status: params?.status && params.status !== 'ALL' ? params.status : undefined,
        storeId: params?.storeId && params.storeId !== 'ALL' ? params.storeId : undefined,
      });

      if (Array.isArray(backendOrders) && backendOrders.length > 0) {
        return backendOrders.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber || o.id,
          storeId: o.restaurantId,
          storeName: o.restaurant?.name || 'Restaurant',
          storeLogo: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=800&q=80',
          customerName: o.customer?.name || 'Customer',
          customerPhone: o.customer?.phone || '+91 98765 43210',
          customerEmail: 'customer@campus.edu',
          deliveryAddress: {
            hostelOrPgName: o.hostelOrPgName || 'Hostel',
            roomNumber: o.roomNumber || '',
            fullAddress: o.deliveryAddress || 'Campus',
            landmark: 'Campus Gate',
          },
          items: (o.orderItems || []).map((i: any) => ({
            id: i.id,
            name: i.itemNameSnapshot,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
            isVeg: true,
          })),
          subtotal: Number(o.subtotal),
          deliveryFee: Number(o.deliveryFee),
          discountAmount: Number(o.discountAmount || 0),
          taxes: 0,
          totalAmount: Number(o.totalAmount),
          total: Number(o.totalAmount),
          paymentMethod: o.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'UPI / Online',
          paymentStatus: o.paymentStatus || 'PENDING',
          orderStatus: o.status as any,
          placedAt: o.createdAt,
          orderDateTime: o.createdAt,
          updatedAt: o.updatedAt,
          timeline: (o.orderEvents || []).map((e: any) => ({
            status: e.eventType,
            timestamp: e.createdAt,
            actor: 'SYSTEM',
            actorName: 'System',
            note: e.eventType,
          })),
          isTimeoutInterventionRequired: o.status === 'WAITING_FOR_ADMIN' || o.status === 'MANAGER_TIMEOUT',
        }));
      }
    } catch (err: any) {
      console.warn('Backend orders fetch failed, fallback to local DB:', err.message);
    }
    return db.getOrders();
  },

  async getOrderById(id: string): Promise<Order> {
    const orders = await this.getOrders();
    const found = orders.find((o) => o.id === id);
    if (!found) throw new Error('Order not found');
    return found;
  },

  async getPendingInterventionOrders(): Promise<Order[]> {
    const orders = await this.getOrders();
    return orders.filter(
      (o) => o.orderStatus === ('Waiting for Admin' as any) || o.orderStatus === ('WAITING_FOR_ADMIN' as any) || o.orderStatus === ('MANAGER_TIMEOUT' as any) || o.isTimeoutInterventionRequired
    );
  },

  async adminAcceptTimeoutOrder(orderId: string, reason?: string): Promise<Order> {
    await AdminApiClient.adminAcceptOrder(orderId, reason);
    return this.getOrderById(orderId);
  },

  async adminRejectTimeoutOrder(orderId: string, reason: string): Promise<Order> {
    await AdminApiClient.adminRejectOrder(orderId, reason);
    return this.getOrderById(orderId);
  },

  async assignPartner(orderId: string, partnerId: string) {
    return this.getOrderById(orderId);
  },

  async updateOrderStatus(orderId: string, status: any, note?: string) {
    if (status === 'ADMIN_ACCEPTED' || status === 'MANAGER_ACCEPTED') {
      return this.adminAcceptTimeoutOrder(orderId, note);
    }
    if (status === 'ADMIN_REJECTED' || status === 'MANAGER_REJECTED' || status === 'CANCELLED') {
      return this.adminRejectTimeoutOrder(orderId, note || 'Cancelled by admin');
    }
    return this.getOrderById(orderId);
  },

  async cancelOrder(orderId: string, reason: string) {
    return this.adminRejectTimeoutOrder(orderId, reason);
  },

  async simulateManagerTimeout() {
    throw new Error('Simulation disabled — actual timeout handled live via BullMQ worker!');
  },
};
