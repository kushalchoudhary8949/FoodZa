const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class ApiClient {
  private static token: string | null = localStorage.getItem('fc_customer_token') || 'usr_student_102';

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('fc_customer_token', token);
    } else {
      localStorage.removeItem('fc_customer_token');
    }
  }

  static getToken(): string | null {
    return this.token;
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = json.message || json.error || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    // Backend returns { success: true, data: T }
    return (json.data !== undefined ? json.data : json) as T;
  }

  // ── Auth ──
  static async register(data: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'CUSTOMER' }),
    });
  }

  static async getProfile() {
    return this.request('/auth/profile');
  }

  // ── Stores & Menu ──
  static async getStores() {
    return this.request<any[]>('/stores');
  }

  static async getStoreMenu(storeId: string) {
    return this.request<any[]>(`/stores/${storeId}/menu`);
  }

  // ── Customer Addresses ──
  static async getAddresses() {
    return this.request<any[]>('/customers/addresses');
  }

  static async createAddress(data: any) {
    return this.request('/customers/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteAddress(id: string) {
    return this.request(`/customers/addresses/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Offers ──
  static async validateOffer(code: string, storeId: string, subtotal: number) {
    return this.request('/offers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, restaurantId: storeId, subtotal }),
    });
  }

  // ── Orders ──
  static async createOrder(data: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getMyOrders() {
    return this.request<any[]>('/orders/my-orders');
  }

  static async getOrderById(id: string) {
    return this.request(`/orders/${id}`);
  }
}
