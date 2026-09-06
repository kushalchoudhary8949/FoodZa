import { Order, PartnerProfile, EarningsSummary, DeliveryStatus } from '../types';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const rawApiUrl = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:3000/api' : 'https://foodza-bckend.onrender.com/api');
const API_BASE_URL = rawApiUrl.replace('foodza-backend.onrender.com', 'foodza-bckend.onrender.com');

const normalizePartnerToken = (partnerId: string) => {
  const normalized = partnerId.trim().toLowerCase();
  return normalized === 'dp-8821' ? 'dp_kiran_01' : normalized;
};

class ApiClient {
  private token: string | null = null;
  private simulatedOrder: Order | null = null;
  private simulatedActiveOrder: Order | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = normalizePartnerToken(localStorage.getItem('dp_token') || 'dp_kiran_01');
      try {
        const savedSim = localStorage.getItem('dp_sim_order');
        if (savedSim) this.simulatedOrder = JSON.parse(savedSim);
        const savedActive = localStorage.getItem('dp_sim_active');
        if (savedActive) this.simulatedActiveOrder = JSON.parse(savedActive);
      } catch {}
    }
  }

  setToken(token: string | null) {
    this.token = token ? normalizePartnerToken(token) : null;
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
        throw new Error(data.message || data.error || `HTTP error ${response.status}`);
      }

      return (data.data !== undefined ? data.data : data) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Server response timed out after 20 seconds');
      }
      throw err;
    }
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
    return { partner: this.buildPartnerProfile(p) };
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
    incomingRequest: Order | null;
    availableOrdersCount: number;
    todayEarnings: number;
    todayDeliveries: number;
    totalEarnings: number;
    totalDeliveries: number;
  }> {
    const profileRes = await this.getProfile();
    let incomingRequest: Order | null = null;
    let activeOrder: Order | null = null;

    try {
      const reqs: any[] = await this.request('/delivery-partners/my-requests');
      if (reqs && reqs.length > 0 && reqs[0].order) {
        incomingRequest = this.mapOrder(reqs[0].order);
      }
    } catch {}

    try {
      const deliveries: any[] = await this.request('/delivery-partners/my-deliveries');
      if (deliveries && deliveries.length > 0) {
        const active = deliveries.find((d: any) => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');
        if (active) {
          activeOrder = this.mapOrder(active);
        }
      }
    } catch {}

    // Fallback to local simulated orders if backend has none
    if (!incomingRequest && this.simulatedOrder) {
      incomingRequest = this.simulatedOrder;
    }
    if (!activeOrder && this.simulatedActiveOrder) {
      activeOrder = this.simulatedActiveOrder;
    }

    return {
      partner: profileRes.partner,
      activeOrder,
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
    if (this.simulatedOrder && this.simulatedOrder.id === orderId) {
      this.simulatedActiveOrder = {
        ...this.simulatedOrder,
        status: 'DELIVERY_ASSIGNED',
        assignedPartnerId: this.token || 'dp_kiran_01',
      };
      this.simulatedOrder = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dp_sim_order');
        localStorage.setItem('dp_sim_active', JSON.stringify(this.simulatedActiveOrder));
      }
      const dash = await this.getDashboard();
      return {
        success: true,
        message: 'Delivery request accepted',
        order: this.simulatedActiveOrder,
        partner: dash.partner,
      };
    }

    let acceptedOrder: Order | null = null;
    try {
      const res: any = await this.request(`/delivery-requests/${orderId}/accept`, { method: 'POST' });
      const raw = res?.order || res?.data?.order || res;
      if (raw && raw.id) {
        acceptedOrder = this.mapOrder(raw);
      }
    } catch (e: any) {
      console.warn('Backend acceptDelivery error, proceeding with active order:', e.message);
    }

    if (!acceptedOrder) {
      const dash = await this.getDashboard();
      acceptedOrder = dash.activeOrder;
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

    const profileRes = await this.getProfile();
    return {
      success: true,
      message: 'Delivery request accepted',
      order: acceptedOrder,
      partner: profileRes.partner,
    };
  }

  async rejectDelivery(orderId: string, _reason?: string): Promise<{ success: boolean; message: string }> {
    if (this.simulatedOrder && this.simulatedOrder.id === orderId) {
      this.simulatedOrder = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dp_sim_order');
      }
      return { success: true, message: 'Delivery request rejected' };
    }
    try {
      await this.request(`/delivery-requests/${orderId}/reject`, { method: 'POST' });
    } catch {}
    return { success: true, message: 'Delivery request rejected' };
  }

  async pickupOrder(orderId: string): Promise<{ success: boolean; message: string; order: Order; partner: PartnerProfile }> {
    if (this.simulatedActiveOrder && this.simulatedActiveOrder.id === orderId) {
      this.simulatedActiveOrder = {
        ...this.simulatedActiveOrder,
        status: 'PICKED_UP',
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('dp_sim_active', JSON.stringify(this.simulatedActiveOrder));
      }
      const dash = await this.getDashboard();
      return { success: true, message: 'Order picked up', order: this.simulatedActiveOrder, partner: dash.partner };
    }

    await this.request(`/deliveries/${orderId}/pickup`, { method: 'POST' });
    const dash = await this.getDashboard();
    return { success: true, message: 'Order picked up', order: dash.activeOrder!, partner: dash.partner };
  }

  async verifyOtp(orderId: string, otp: string): Promise<{ success: boolean; verified: boolean; message: string; order: Order; partner: PartnerProfile }> {
    if (this.simulatedActiveOrder && this.simulatedActiveOrder.id === orderId) {
      const correct = otp === (this.simulatedActiveOrder.secretOtp || '1234') || otp === '1234' || otp === '5821';
      if (!correct) {
        throw new Error('Invalid OTP. Please check with the customer.');
      }
      this.simulatedActiveOrder = {
        ...this.simulatedActiveOrder,
        otpVerified: true,
        status: 'OUT_FOR_DELIVERY',
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('dp_sim_active', JSON.stringify(this.simulatedActiveOrder));
      }
      const dash = await this.getDashboard();
      return { success: true, verified: true, message: 'OTP verified successfully', order: this.simulatedActiveOrder, partner: dash.partner };
    }

    await this.request(`/deliveries/${orderId}/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
    const dash = await this.getDashboard();
    return { success: true, verified: true, message: 'OTP verified', order: dash.activeOrder!, partner: dash.partner };
  }

  async confirmPayment(orderId: string): Promise<{ success: boolean; message: string; order: Order; partner: PartnerProfile }> {
    if (this.simulatedActiveOrder && this.simulatedActiveOrder.id === orderId) {
      this.simulatedActiveOrder = {
        ...this.simulatedActiveOrder,
        paymentReceived: true,
        paymentStatus: 'COLLECTED_CASH',
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('dp_sim_active', JSON.stringify(this.simulatedActiveOrder));
      }
      const dash = await this.getDashboard();
      return { success: true, message: 'COD payment collected', order: this.simulatedActiveOrder, partner: dash.partner };
    }

    const dash = await this.getDashboard();
    const amount = dash.activeOrder?.orderAmount || 200;
    await this.request(`/deliveries/${orderId}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amountCollected: amount }),
    });
    const updatedDash = await this.getDashboard();
    return { success: true, message: 'COD payment collected', order: updatedDash.activeOrder!, partner: updatedDash.partner };
  }

  async completeDelivery(orderId: string): Promise<{ success: boolean; message: string; order: Order; earningsAdded: number; partner: PartnerProfile }> {
    if (this.simulatedActiveOrder && this.simulatedActiveOrder.id === orderId) {
      const completedOrder = this.simulatedActiveOrder;
      this.simulatedActiveOrder = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dp_sim_active');
      }
      const profileRes = await this.getProfile();
      return {
        success: true,
        message: 'Order delivered successfully',
        order: { ...completedOrder, status: 'DELIVERED' },
        earningsAdded: 40,
        partner: profileRes.partner,
      };
    }

    await this.request(`/deliveries/${orderId}/complete`, { method: 'POST' });
    const profileRes = await this.getProfile();
    return {
      success: true,
      message: 'Order delivered successfully',
      order: { id: orderId } as any,
      earningsAdded: 40,
      partner: profileRes.partner,
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

  async dispatchNewOrder(): Promise<{ success: boolean; message: string; order: Order }> {
    try {
      const res: any = await this.request('/delivery-partners/simulate-dispatch', { method: 'POST' });
      const dash = await this.getDashboard();
      if (dash.incomingRequest) {
        return {
          success: true,
          message: res?.message || 'Delivery request dispatched by backend',
          order: dash.incomingRequest,
        };
      }
    } catch (err: any) {
      console.warn('Backend simulate-dispatch not available, generating realistic simulated order:', err.message);
    }

    // Build realistic simulated order
    const orderId = `FC-${Math.floor(1000 + Math.random() * 9000)}`;
    const sampleOrder: Order = {
      id: orderId,
      store: {
        id: 'store-1',
        name: 'The Campus Pizzeria & Rolls',
        phone: '+91 98000 11122',
        address: 'Food Court, Block 3, Campus Center',
        landmark: 'Opposite Central Fountain',
        coordinates: { lat: 28.6139, lng: 77.209 },
      },
      customer: {
        id: 'cust-1',
        name: 'Rohit Verma',
        phone: '+91 98765 43210',
        address: 'Aryabhatta Hostel, Block B',
        roomOrFloor: 'Room 304, 3rd Floor',
        coordinates: { lat: 28.6145, lng: 77.2095 },
      },
      items: [
        { id: 'item-1', name: 'Paneer Tikka Roll (Double)', quantity: 1, price: 160, isVeg: true },
        { id: 'item-2', name: 'Loaded Cheese Fries', quantity: 1, price: 90, isVeg: true },
        { id: 'item-3', name: 'Fresh Lime Soda', quantity: 1, price: 40, isVeg: true },
      ],
      orderAmount: 290,
      deliveryEarnings: 40,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      amountToCollect: 290,
      status: 'WAITING_FOR_PARTNER',
      assignedPartnerId: null,
      secretOtp: '5821',
      otpVerified: false,
      paymentReceived: false,
      distanceKm: 1.4,
      estimatedMinutes: 14,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          status: 'WAITING_FOR_PARTNER',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: 'Ready for Pickup',
          description: 'Food is packed and hot at the store counter',
        },
      ],
    };

    this.simulatedOrder = sampleOrder;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dp_sim_order', JSON.stringify(sampleOrder));
    }

    return {
      success: true,
      message: `Simulated incoming order #${sampleOrder.id} dispatched!`,
      order: sampleOrder,
    };
  }

  async resetSimulator(): Promise<{ success: boolean; message: string }> {
    this.simulatedOrder = null;
    this.simulatedActiveOrder = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dp_sim_order');
      localStorage.removeItem('dp_sim_active');
    }
    return { success: true, message: 'Simulator state reset' };
  }
}

export const api = new ApiClient();
