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

  static async request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Render free-tier cold starts can take 30-50s. Other panels use 20s;
    // admin was 6s which guaranteed fallback to local DB on every cold start.
    const REQUEST_TIMEOUT_MS = 25000;
    let lastError: any = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
        lastError = err;
        const isAbort = err.name === 'AbortError';
        const isTransient =
          isAbort || err?.name === 'TypeError' || err.message?.includes('Failed to fetch');
        // Only retry safe idempotent reads (GET) on transient failures.
        const isGet = !options.method || options.method.toUpperCase() === 'GET';
        if (isTransient && isGet && attempt < retries) {
          // Backoff: 1s, 2s — gives Render cold start time to wake up.
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        if (isAbort) {
          throw new Error(
            `Server response timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds (attempt ${attempt + 1}/${retries + 1}) — ${options.method || 'GET'} ${endpoint}. Backend may be cold-starting on Render.`
          );
        }
        throw err;
      }
    }
    throw lastError;
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

  // ── Menu ──
  static async getStoreMenu(storeId: string) {
    return this.request<any[]>(`/stores/${storeId}/menu`);
  }

  static async createMenuCategory(storeId: string, data: any) {
    return this.request(`/stores/${storeId}/menu/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateMenuCategory(categoryId: string, data: any) {
    return this.request(`/menu/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteMenuCategory(categoryId: string) {
    return this.request(`/menu/categories/${categoryId}`, { method: 'DELETE' });
  }

  static async createMenuItem(storeId: string, data: any) {
    return this.request(`/stores/${storeId}/menu/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateMenuItem(itemId: string, data: any) {
    return this.request(`/menu/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteMenuItem(itemId: string) {
    return this.request(`/menu/items/${itemId}`, { method: 'DELETE' });
  }

  static async toggleMenuItemAvailability(itemId: string, isAvailable: boolean) {
    return this.request(`/menu/items/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
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
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const params = searchParams.toString();
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
