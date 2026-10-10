import { StoreManager, AccountStatus } from '../../types';
import { db } from '../storage';
import { AdminApiClient } from '../adminApi';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/** Map a backend Manager row (with user + restaurant) into the admin-panel shape */
function mapBackendToManager(m: any): StoreManager {
  const isActive = m.isActive !== false && m.user?.isActive !== false;
  return {
    id: m.id,
    name: m.user?.name || 'Store Manager',
    phoneNumber: m.user?.phone || '',
    phone: m.user?.phone || '',
    email: m.user?.email || '',
    loginId: `MGR-${String(m.id).slice(-6).toUpperCase()}`,
    assignedStoreId: m.restaurantId,
    assignedStoreName: m.restaurant?.name,
    status: isActive ? 'Active' : 'Inactive',
    joinedDate: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    totalOrdersManaged: 0,
  };
}

export interface CreateManagerDto {
  name: string;
  phoneNumber?: string;
  phone?: string;
  email: string;
  loginId: string;
  assignedStoreId?: string;
  status?: AccountStatus;
  accountStatus?: AccountStatus;
}

export interface UpdateManagerDto extends Partial<CreateManagerDto> {
  id: string;
}

export const managerService = {
  async getManagers(): Promise<StoreManager[]> {
    try {
      const data = await AdminApiClient.getManagers();
      if (data && Array.isArray(data) && data.length > 0) {
        const backendManagers = data.map(mapBackendToManager);
        // Sync localStorage so dropdowns/assignments use real backend IDs
        db.setManagers(backendManagers);
        return backendManagers;
      }
    } catch (err) {
      console.warn('Backend manager fetch failed, falling back to local:', err);
    }
    await delay();
    return db.getManagers();
  },

  async getManagerById(id: string): Promise<StoreManager | undefined> {
    await delay();
    const managers = db.getManagers();
    return managers.find((m) => m.id === id);
  },

  async createManager(data: CreateManagerDto): Promise<StoreManager> {
    await delay();
    const managers = db.getManagers();
    const stores = db.getStores();

    let assignedStoreName: string | undefined;
    if (data.assignedStoreId) {
      const store = stores.find((s) => s.id === data.assignedStoreId);
      if (store) assignedStoreName = store.name;
    }

    const phoneVal = data.phoneNumber || data.phone || '';
    const newManager: StoreManager = {
      id: `mgr_${Date.now()}`,
      name: data.name.trim(),
      phoneNumber: phoneVal.trim(),
      email: data.email.trim(),
      loginId: data.loginId.trim().toUpperCase(),
      assignedStoreId: data.assignedStoreId,
      assignedStoreName,
      status: data.status || 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      totalOrdersManaged: 0,
    };

    const updated = [newManager, ...managers];
    db.setManagers(updated);

    // If assigned to a store, update store record as well
    if (data.assignedStoreId) {
      const updatedStores = stores.map((s) => {
        if (s.id === data.assignedStoreId) {
          return { ...s, managerId: newManager.id, managerName: newManager.name };
        }
        return s;
      });
      db.setStores(updatedStores);
    }

    return newManager;
  },

  async updateManager(data: UpdateManagerDto): Promise<StoreManager> {
    await delay();
    const managers = db.getManagers();
    const stores = db.getStores();
    const existing = managers.find((m) => m.id === data.id);
    if (!existing) throw new Error('Store manager not found');

    let assignedStoreName = existing.assignedStoreName;
    if (data.assignedStoreId !== undefined) {
      if (data.assignedStoreId) {
        const store = stores.find((s) => s.id === data.assignedStoreId);
        assignedStoreName = store?.name;
      } else {
        assignedStoreName = undefined;
      }
    }

    const updatedManager: StoreManager = {
      ...existing,
      ...data,
      assignedStoreName,
    };

    const updated = managers.map((m) => (m.id === data.id ? updatedManager : m));
    db.setManagers(updated);

    // Sync store manager info
    if (data.assignedStoreId !== undefined && data.assignedStoreId !== existing.assignedStoreId) {
      const updatedStores = stores.map((s) => {
        if (existing.assignedStoreId && s.id === existing.assignedStoreId) {
          return { ...s, managerId: undefined, managerName: undefined };
        }
        if (data.assignedStoreId && s.id === data.assignedStoreId) {
          return { ...s, managerId: updatedManager.id, managerName: updatedManager.name };
        }
        return s;
      });
      db.setStores(updatedStores);
    }

    return updatedManager;
  },

  async deleteManager(id: string): Promise<void> {
    await delay();
    const managers = db.getManagers();
    const target = managers.find((m) => m.id === id);
    const filtered = managers.filter((m) => m.id !== id);
    db.setManagers(filtered);

    if (target?.assignedStoreId) {
      const stores = db.getStores();
      const updatedStores = stores.map((s) => {
        if (s.id === target.assignedStoreId) {
          return { ...s, managerId: undefined, managerName: undefined };
        }
        return s;
      });
      db.setStores(updatedStores);
    }
  },

  async toggleManagerStatus(id: string): Promise<StoreManager> {
    await delay();
    const managers = db.getManagers();
    const target = managers.find((m) => m.id === id);
    if (!target) throw new Error('Manager not found');

    const nextStatus: AccountStatus = target.status === 'Active' ? 'Inactive' : 'Active';
    const updated = managers.map((m) => (m.id === id ? { ...m, status: nextStatus } : m));
    db.setManagers(updated);
    return { ...target, status: nextStatus };
  },

  async toggleStatus(id: string): Promise<StoreManager> {
    return this.toggleManagerStatus(id);
  },

  async assignStore(managerId: string, storeId: string): Promise<StoreManager> {
    return this.updateManager({ id: managerId, assignedStoreId: storeId });
  },
};
