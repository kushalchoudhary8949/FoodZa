const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const rawApiUrl = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:4000/api' : 'https://foodza-bckend.onrender.com/api');
const API_BASE_URL = rawApiUrl.replace('foodza-backend.onrender.com', 'foodza-bckend.onrender.com');

export class ManagerApiClient {
  private static token: string | null = localStorage.getItem('fc_manager_token') || null;

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('fc_manager_token', token);
    } else {
      localStorage.removeItem('fc_manager_token');
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

      return (json.data !== undefined ? json.data : json) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Server response timed out after 20 seconds');
      }
      throw err;
    }
  }

  // ── Auth & Profile ──
  static async getProfile() {
    return this.request('/auth/profile');
  }

  // ── Store Management ──
  static async toggleStoreOpen(storeId: string) {
    return this.request(`/stores/${storeId}/toggle-open`, { method: 'POST' });
  }

  static async updateStore(storeId: string, data: any) {
    return this.request(`/stores/${storeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ── Order Workflow ──
  static async getStoreOrders(storeId?: string) {
    return this.request<any[]>(`/orders/store-orders${storeId ? `?storeId=${storeId}` : ''}`);
  }

  static async acceptOrder(orderId: string, reason?: string) {
    return this.request(`/orders/${orderId}/manager/accept`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async rejectOrder(orderId: string, reason?: string) {
    return this.request(`/orders/${orderId}/manager/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async startPreparingOrder(orderId: string) {
    return this.request(`/orders/${orderId}/preparing`, { method: 'POST' });
  }

  static async markFoodReady(orderId: string) {
    return this.request(`/orders/${orderId}/ready`, { method: 'POST' });
  }

  // ── Menu Management ──
  static async getStoreMenu(storeId: string) {
    return this.request<any[]>(`/stores/${storeId}/menu`);
  }

  static async addCategory(storeId: string, name: string, description?: string) {
    return this.request(`/stores/${storeId}/menu/categories`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  static async updateCategory(categoryId: string, name: string, description?: string) {
    return this.request(`/menu/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, description }),
    });
  }

  static async deleteCategory(categoryId: string) {
    return this.request(`/menu/categories/${categoryId}`, { method: 'DELETE' });
  }

  static async addMenuItem(storeId: string, item: any) {
    return this.request(`/stores/${storeId}/menu/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  static async updateMenuItem(itemId: string, updates: any) {
    return this.request(`/menu/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  static async toggleItemAvailability(itemId: string, isAvailable: boolean) {
    return this.request(`/menu/items/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    });
  }

  static async deleteMenuItem(itemId: string) {
    return this.request(`/menu/items/${itemId}`, { method: 'DELETE' });
  }

  // ── Sales ──
  static async getStoreSales(storeId: string) {
    return this.request(`/sales/store/${storeId}`);
  }

  // ── Issue Box ──
  static async createIssue(category: string, subject: string, initialMessage: string) {
    return this.request('/issues', {
      method: 'POST',
      body: JSON.stringify({ category, subject, initialMessage }),
    });
  }

  static async getIssues() {
    return this.request<any[]>('/issues');
  }

  static async sendMessageToIssue(issueId: string, message: string) {
    return this.request(`/issues/${issueId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}
