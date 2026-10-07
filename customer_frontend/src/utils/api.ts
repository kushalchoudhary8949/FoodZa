const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('172.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.endsWith('.local') ||
  import.meta.env.DEV
);
const localHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const rawApiUrl = import.meta.env.VITE_API_URL || (isLocal ? `http://${localHost}:4000/api` : 'https://foodza-bckend.onrender.com/api');
const API_BASE_URL = rawApiUrl.replace('foodza-backend.onrender.com', 'foodza-bckend.onrender.com');

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = json.message || json.error || `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }

      // Backend returns { success: true, data: T }
      return (json.data !== undefined ? json.data : json) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Server response timed out after 20 seconds');
      }
      throw err;
    }
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
