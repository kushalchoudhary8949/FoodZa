import { Order, PartnerProfile, EarningsSummary, DeliveryStatus } from '../types';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const rawApiUrl = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:4000/api' : 'https://foodza-bckend.onrender.com/api');
const API_BASE_URL = rawApiUrl.replace('foodza-backend.onrender.com', 'foodza-bckend.onrender.com');

const normalizePartnerToken = (partnerId: string) => {
  const normalized = partnerId.trim().toLowerCase();
  return normalized === 'dp-8821' ? 'dp_kiran_01' : normalized;
};

class ApiClient {
  private token: string | null = null;
  private cachedPartner: PartnerProfile | null = null;
  private cachedActiveOrder: Order | null = null;
  private cachedIncomingRequest: Order | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = normalizePartnerToken(localStorage.getItem('dp_token') || 'dp_kiran_01');
    }
  }

  setToken(token: string | null) {
    const nextToken = token ? normalizePartnerToken(token) : null;
    if (this.token !== nextToken) {
      this.cachedPartner = null;
      this.cachedActiveOrder = null;
      this.cachedIncomingRequest = null;
    }
    this.token = nextToken;
    if (typeof window !== 'undefined') {
      if (this.token) {
        localStorage.setItem('dp_token', this.token);
      } else {
        localStorage.removeItem('dp_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const isTransientGatewayError = [502, 503, 504].includes(response.status);
          if (isTransientGatewayError && attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          const error = new Error(data.message || data.error || `HTTP error ${response.status}`);
          Object.assign(error, { status: response.status });
          throw error;
        }

        return (data.data !== undefined ? data.data : data) as T;
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isTransientNetworkError = err?.name === 'TypeError' || err?.name === 'AbortError';
        if (isTransientNetworkError && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        if (err?.name === 'AbortError') {
          throw new Error('Server response timed out after 20 seconds');
        }
        throw err;
      }
    }

    throw new Error('Unable to reach the backend');
  }

  // Auth
  async login(partnerId: string, _password?: string): Promise<{ token: string; partner: PartnerProfile; activeOrder: Order | null; incomingRequest: Order | null }> {
    const token = normalizePartnerToken(partnerId);
    this.setToken(token);
    const profile = await this.getProfile();
    return {
      token,
      partner: profile.partner,
      activeOrder: null,
      incomingRequest: null,
    };
  }

  async forgotPassword(partnerId: string, _newPassword?: string): Promise<{ success: boolean; message: string; registeredPhone?: string }> {
    return { success: true, message: 'Password reset request received', registeredPhone: '+91 98451 99221' };
  }

  private buildPartnerProfile(p: any): PartnerProfile {
    return {
      id: p.id || 'dp-1',
      name: p.user?.name || 'Kiran Reddy',
      phone: p.phone || p.user?.phone || '+91 98451 99221',
      email: p.user?.email || 'kiran.dp@foodconnect.com',
      vehicleType: 'TVS Ntorq 125',
      vehicleNumber: 'KA-03-HA-8821',
      rating: 4.9,
      // Preserve the backend status; only use the demo default when no status exists.
      isOnline: p.onlineStatus ? p.onlineStatus === 'ONLINE' : true,
      totalDeliveries: p.totalDeliveries || 42,
      totalEarnings: Number(p.totalEarnings || 1680),
      todayEarnings: 240,
      todayDeliveries: 6,
      status: 'ACTIVE',
      joinedDate: p.createdAt || '2026-01-10',
      bankDetails: {
        accountHolder: p.user?.name || 'Kiran Reddy',
        accountNumberMasked: '•••• •••• 4410',
        ifscCode: 'HDFC0001024',
        bankName: 'HDFC Bank Campus Branch',
        upiId: 'kiranreddy@upi',
      },
    };
  }

  mapOrder(o: any): Order {
    const rawStatus = o.status as string;
    let mappedStatus: DeliveryStatus = 'WAITING_FOR_PARTNER';

    if (rawStatus === 'DELIVERY_ASSIGNED') mappedStatus = 'DELIVERY_ASSIGNED';
    else if (rawStatus === 'PICKED_UP') mappedStatus = 'PICKED_UP';
    else if (rawStatus === 'OUT_FOR_DELIVERY') mappedStatus = 'OUT_FOR_DELIVERY';
    else if (rawStatus === 'DELIVERED') mappedStatus = 'DELIVERED';
    else if (rawStatus === 'CANCELLED' || rawStatus === 'MANAGER_REJECTED') mappedStatus = 'DELIVERY_CANCELLED';

    return {
      id: o.id,
      store: {
        id: o.restaurantId || 'store-1',
        name: o.restaurant?.name || 'Store',
        phone: o.restaurant?.phone || '+91 98000 11122',
        address: o.restaurant?.address || 'Campus Gate',
        landmark: 'Near North Gate',
        coordinates: { lat: 28.6139, lng: 77.209 },
      },
      customer: {
        id: o.customerId || 'cust-1',
        name: o.customer?.name || 'Customer',
        phone: o.customer?.phone || '+91 98765 43210',
        address: o.deliveryAddress || 'Hostel B',
        roomOrFloor: o.roomNumber || '',
        coordinates: { lat: 28.6145, lng: 77.2095 },
      },
      items: (o.orderItems || []).map((i: any) => ({
        id: i.id,
        name: i.itemNameSnapshot,
        quantity: i.quantity,
        price: Number(i.unitPrice),
        isVeg: true,
      })),
      orderAmount: Number(o.totalAmount || 150),
      deliveryEarnings: 40,
      paymentMethod: o.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : 'ONLINE',
      paymentStatus: o.paymentStatus === 'PAID' ? 'COLLECTED_CASH' : 'PENDING',
      amountToCollect: o.paymentMethod === 'CASH_ON_DELIVERY' ? Number(o.totalAmount) : 0,
      status: mappedStatus,
      assignedPartnerId: o.deliveryPartnerId || null,
      secretOtp: '1234',
      otpVerified: false,
      paymentReceived: o.paymentStatus === 'PAID',
      distanceKm: 1.5,
      estimatedMinutes: 15,
      createdAt: o.createdAt || new Date().toISOString(),
      timeline: [
        { status: mappedStatus, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), title: 'Status Update', description: `Order is ${mappedStatus}` },
      ],
    };
  }

  // Partner Profile & Status
  async getProfile(): Promise<{ partner: PartnerProfile }> {
    const p: any = await this.request('/delivery-partners/profile');
    this.cachedPartner = this.buildPartnerProfile(p);
    return { partner: this.cachedPartner };
  }

  async toggleStatus(isOnline: boolean): Promise<{ success: boolean; isOnline: boolean; partner: PartnerProfile }> {
    const endpoint = isOnline ? '/delivery-partners/go-online' : '/delivery-partners/go-offline';
    await this.request(endpoint, { method: 'POST' });
    const profileRes = await this.getProfile();
    return {
      success: true,
      isOnline,
      partner: { ...profileRes.partner, isOnline },
    };
  }

  async getDashboard(): Promise<{
    partner: PartnerProfile;
    activeOrder: Order | null;
    activeOrders: Order[];
    incomingRequest: Order | null;
    availableOrdersCount: number;
    todayEarnings: number;
    todayDeliveries: number;
    totalEarnings: number;
    totalDeliveries: number;
  }> {
    const profileRes = await this.getProfile();
    let incomingRequest = this.cachedIncomingRequest;
    let activeOrder = this.cachedActiveOrder;
    let activeOrders: Order[] = [];

    try {
      const reqs: any[] = await this.request('/delivery-partners/my-requests');
      const pending = reqs?.find((request: any) => request.order);
      incomingRequest = pending ? this.mapOrder(pending.order) : null;
      this.cachedIncomingRequest = incomingRequest;
    } catch (error) {
      console.error('Failed to refresh pending delivery requests:', error);
    }

    try {
      const deliveries: any[] = await this.request('/delivery-partners/my-deliveries');
      if (deliveries && deliveries.length > 0) {
        const activeList = deliveries
          .filter((d: any) => d.status !== 'DELIVERED' && d.status !== 'CANCELLED')
          .map((d: any) => this.mapOrder(d));
        if (activeList.length > 0) {
          activeOrders = activeList;
          activeOrder = activeList[0];
        }
      }
      this.cachedActiveOrder = activeOrder;
    } catch (error) {
      console.error('Failed to refresh active deliveries:', error);
    }

    return {
      partner: profileRes.partner,
      activeOrder,
      activeOrders,
      incomingRequest,
      availableOrdersCount: incomingRequest ? 1 : 0,
      todayEarnings: profileRes.partner.todayEarnings,
      todayDeliveries: profileRes.partner.todayDeliveries,
      totalEarnings: profileRes.partner.totalEarnings,
      totalDeliveries: profileRes.partner.totalDeliveries,
    };
  }

  // Delivery Actions
  async acceptDelivery(orderId: string, fallbackOrder?: Order | null): Promise<{ success: boolean; message: string; order: Order; partner: PartnerProfile }> {
    let acceptedOrder: Order | null = null;
    const res: any = await this.request(`/delivery-requests/${orderId}/accept`, { method: 'POST' });
    const raw = res?.order || res?.data?.order || res;
    if (raw && raw.id) {
      acceptedOrder = this.mapOrder(raw);
    }

    if (!acceptedOrder) {
      acceptedOrder = this.cachedActiveOrder;
    }

    if (!acceptedOrder && fallbackOrder) {
      acceptedOrder = {
        ...fallbackOrder,
        status: 'DELIVERY_ASSIGNED',
        assignedPartnerId: this.token || 'dp_kiran_01',
      };
    }

    if (!acceptedOrder) {
      acceptedOrder = this.mapOrder({
        id: orderId,
        status: 'DELIVERY_ASSIGNED',
      });
    }

    this.cachedActiveOrder = acceptedOrder;
    return {
      success: true,
      message: 'Delivery request accepted',
      order: acceptedOrder,
      partner: this.cachedPartner || this.buildPartnerProfile({ id: this.token }),
    };
  }

  async rejectDelivery(orderId: string, _reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.request(`/delivery-requests/${orderId}/reject`, { method: 'POST' });
    } catch {}
    return { success: true, message: 'Delivery request rejected' };
  }

  async pickupOrder(orderId: string): Promise<{ success: boolean; message: string; order: Order; partner: PartnerProfile }> {
    const raw = await this.request<any>(`/deliveries/${orderId}/pickup`, { method: 'POST' });
    const order = this.mapOrder(raw);
    this.cachedActiveOrder = order;
    return { success: true, message: 'Order picked up', order, partner: this.cachedPartner || this.buildPartnerProfile({ id: this.token }) };
  }

  async outForDelivery(orderId: string): Promise<{ success: boolean; message: string; order: Order; partner: PartnerProfile }> {
    const raw = await this.request<any>(`/deliveries/${orderId}/out-for-delivery`, { method: 'POST' });
    const order = this.mapOrder(raw);
    this.cachedActiveOrder = order;
    return { success: true, message: 'Order is out for delivery', order, partner: this.cachedPartner || this.buildPartnerProfile({ id: this.token }) };
  }

  async verifyOtp(orderId: string, otp: string): Promise<{ success: boolean; verified: boolean; message: string; order: Order; partner: PartnerProfile }> {
    await this.request(`/deliveries/${orderId}/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
    const order = this.cachedActiveOrder
      ? { ...this.cachedActiveOrder, status: 'OUT_FOR_DELIVERY' as const, otpVerified: true }
      : this.mapOrder({ id: orderId, status: 'OUT_FOR_DELIVERY' });
    this.cachedActiveOrder = order;
    return { success: true, verified: true, message: 'OTP verified', order, partner: this.cachedPartner || this.buildPartnerProfile({ id: this.token }) };
  }

  async confirmPayment(orderId: string): Promise<{ success: boolean; message: string; order: Order; partner: PartnerProfile }> {
    const amount = this.cachedActiveOrder?.orderAmount || 200;
    await this.request(`/deliveries/${orderId}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amountCollected: amount }),
    });
    const order = this.cachedActiveOrder
      ? { ...this.cachedActiveOrder, paymentReceived: true, paymentStatus: 'COLLECTED_CASH' as const }
      : this.mapOrder({ id: orderId, status: 'OUT_FOR_DELIVERY', paymentStatus: 'PAID' });
    this.cachedActiveOrder = order;
    return { success: true, message: 'COD payment collected', order, partner: this.cachedPartner || this.buildPartnerProfile({ id: this.token }) };
  }

  async completeDelivery(orderId: string): Promise<{ success: boolean; message: string; order: Order; earningsAdded: number; partner: PartnerProfile }> {
    const raw = await this.request<any>(`/deliveries/${orderId}/complete`, { method: 'POST' });
    const order = raw?.id ? this.mapOrder(raw) : {
      ...(this.cachedActiveOrder || this.mapOrder({ id: orderId, status: 'DELIVERED' })),
      status: 'DELIVERED' as const,
    };
    this.cachedActiveOrder = null;
    return {
      success: true,
      message: 'Order delivered successfully',
      order,
      earningsAdded: 40,
      partner: this.cachedPartner || this.buildPartnerProfile({ id: this.token }),
    };
  }

  // History & Earnings
  async getDeliveryHistory(): Promise<{ history: Order[] }> {
    try {
      const res: any[] = await this.request('/delivery-partners/my-deliveries');
      const mapped: Order[] = (res || []).map((o: any) => this.mapOrder(o));
      return { history: mapped };
    } catch {
      return { history: [] };
    }
  }

  async getEarnings(): Promise<EarningsSummary> {
    const p = await this.getProfile();
    return {
      todayEarnings: p.partner.todayEarnings,
      todayDeliveries: p.partner.todayDeliveries,
      weekEarnings: p.partner.totalEarnings * 3,
      totalEarnings: p.partner.totalEarnings,
      totalCompletedDeliveries: p.partner.totalDeliveries,
      averagePerDelivery: 40,
      incentivesBonus: 100,
      dailyBreakdown: [],
      recentPayouts: [],
    };
  }

}

export const api = new ApiClient();
