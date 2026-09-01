const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:3000/api' : 'https://foodza-backend.onrender.com/api');

export class AdminApiClient {
  private static token: string | null = localStorage.getItem('fc_admin_token') || 'usr_admin_01';

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('fc_admin_token', token);
    } else {
      localStorage.removeItem('fc_admin_token');
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
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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

      return (json.data !== undefined ? json.data : json) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Server response timed out after 6 seconds');
      }
      throw err;
    }
  }

  // ── Dashboard Metrics ──
  static async getDashboard() {
    return this.request('/admin/dashboard');
  }

  // ── Stores ──
  static async getStores() {
    return this.request<any[]>('/stores?all=true');
  }

  static async createStore(data: any) {
    return this.request('/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateStore(id: string, data: any) {
    return this.request(`/stores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deactivateStore(id: string) {
    return this.request(`/stores/${id}`, { method: 'DELETE' });
  }

  static async activateStore(id: string) {
    return this.request(`/stores/${id}/activate`, { method: 'POST' });
  }

  // ── Managers ──
  static async getManagers() {
    return this.request<any[]>('/store-managers');
  }

  static async createManager(data: any) {
    return this.request('/store-managers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async assignStoreToManager(id: string, restaurantId: string) {
    return this.request(`/store-managers/${id}/assign-store`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId }),
    });
  }

  // ── Delivery Partners ──
  static async getDeliveryPartners() {
    return this.request<any[]>('/admin/delivery-partners');
  }

  static async createDeliveryPartner(data: any) {
    return this.request('/admin/delivery-partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async activatePartner(id: string) {
    return this.request(`/admin/delivery-partners/${id}/activate`, { method: 'POST' });
  }

  static async deactivatePartner(id: string) {
    return this.request(`/admin/delivery-partners/${id}/deactivate`, { method: 'POST' });
  }

  // ── Orders ──
  static async getAllOrders(query: any = {}) {
    const params = new URLSearchParams(query).toString();
    return this.request<any[]>(`/orders/admin/all${params ? `?${params}` : ''}`);
  }

  static async adminAcceptOrder(orderId: string, reason?: string) {
    return this.request(`/orders/${orderId}/admin/accept`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async adminRejectOrder(orderId: string, reason?: string) {
    return this.request(`/orders/${orderId}/admin/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ── Offers ──
  static async getOffers() {
    return this.request<any[]>('/offers/admin/all');
  }

  static async createOffer(data: any) {
    return this.request('/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deactivateOffer(id: string) {
    return this.request(`/offers/${id}`, { method: 'DELETE' });
  }

  // ── Sales ──
  static async getSalesOverview() {
    return this.request('/sales/overview');
  }

  static async getTopItems() {
    return this.request<any[]>('/sales/top-items');
  }

  // ── Issues ──
  static async getIssues() {
    return this.request<any[]>('/issues');
  }

  static async sendMessageToIssue(id: string, message: string) {
    return this.request(`/issues/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  static async updateIssueStatus(id: string, status: string) {
    return this.request(`/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ── Audit Logs ──
  static async getAuditLogs() {
    return this.request<any[]>('/admin/audit-logs');
  }
}
