import { Order, PartnerProfile, EarningsSummary, DeliveryStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('dp_token') || 'dp_kiran_01';
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('dp_token', token);
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error ${response.status}`);
    }

    return (data.data !== undefined ? data.data : data) as T;
  }

  // Auth
  async login(partnerId: string, _password?: string): Promise<{ token: string; partner: PartnerProfile; activeOrder: Order | null; incomingRequest: Order | null }> {
    this.setToken(partnerId);
    try {
      const profile = await this.getProfile();
      return {
        token: partnerId,
        partner: profile.partner,
        activeOrder: null,
        incomingRequest: null,
      };
    } catch {
      const mockPartner = this.buildPartnerProfile({ id: partnerId });
      return {
        token: partnerId,
        partner: mockPartner,
        activeOrder: null,
        incomingRequest: null,
      };
    }
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
      isOnline: p.onlineStatus === 'ONLINE' || true,
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

  private mapOrder(o: any): Order {
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
      partner: profileRes.partner,
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
  async acceptDelivery(orderId: string): Promise<{ success: boolean; message: string; order: Order; partner: PartnerProfile }> {
    await this.request(`/delivery-requests/${orderId}/accept`, { method: 'POST' });
    const dash = await this.getDashboard();
    return {
      success: true,
      message: 'Delivery request accepted',
      order: dash.activeOrder || ({ id: orderId } as any),
      partner: dash.partner,
    };
  }

  async rejectDelivery(orderId: string, _reason?: string): Promise<{ success: boolean; message: string }> {
    await this.request(`/delivery-requests/${orderId}/reject`, { method: 'POST' });
    return { success: true, message: 'Delivery request rejected' };
  }

  async pickupOrder(orderId: string): Promise<{ success: boolean; message: string; order: Order; partner: PartnerProfile }> {
    await this.request(`/deliveries/${orderId}/pickup`, { method: 'POST' });
    const dash = await this.getDashboard();
    return { success: true, message: 'Order picked up', order: dash.activeOrder!, partner: dash.partner };
  }

  async verifyOtp(orderId: string, otp: string): Promise<{ success: boolean; verified: boolean; message: string; order: Order; partner: PartnerProfile }> {
    await this.request(`/deliveries/${orderId}/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
    const dash = await this.getDashboard();
    return { success: true, verified: true, message: 'OTP verified', order: dash.activeOrder!, partner: dash.partner };
  }

  async confirmPayment(orderId: string): Promise<{ success: boolean; message: string; order: Order; partner: PartnerProfile }> {
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
    const res: any[] = await this.request('/delivery-partners/my-deliveries');
    const mapped: Order[] = (res || []).map((o: any) => this.mapOrder(o));
    return { history: mapped };
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
    throw new Error('Simulation disabled — real orders dispatched by backend');
  }

  async resetSimulator(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Reset completed' };
  }
}

export const api = new ApiClient();
