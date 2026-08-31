import { Store, StoreStatus } from '../../types';
import { db } from '../storage';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export interface CreateStoreDto {
  name: string;
  logo?: string;
  description: string;
  location: string;
  contactNumber: string;
  openingTime: string;
  closingTime: string;
  managerId?: string;
  status?: StoreStatus;
}

export interface UpdateStoreDto extends Partial<CreateStoreDto> {
  id: string;
}

export const storeService = {
  async getStores(): Promise<Store[]> {
    await delay();
    return db.getStores();
  },

  async getStoreById(id: string): Promise<Store | undefined> {
    await delay();
    const stores = db.getStores();
    return stores.find((s) => s.id === id);
  },

  async createStore(data: CreateStoreDto): Promise<Store> {
    await delay();
    const stores = db.getStores();
    const managers = db.getManagers();
    
    let managerName = '';
    if (data.managerId) {
      const mgr = managers.find((m) => m.id === data.managerId);
      if (mgr) managerName = mgr.name;
    }

    const newStore: Store = {
      id: `store_${Date.now()}`,
      name: data.name.trim(),
      logo: data.logo?.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
      description: data.description.trim(),
      location: data.location.trim(),
      contactNumber: data.contactNumber.trim(),
      openingTime: data.openingTime || '10:00 AM',
      closingTime: data.closingTime || '11:00 PM',
      status: data.status || 'Active',
      managerId: data.managerId,
      managerName: managerName || undefined,
      rating: 4.5,
      totalOrders: 0,
      totalSales: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newStore, ...stores];
    db.setStores(updated);

    // If a manager was assigned, update that manager's assigned store
    if (data.managerId) {
      const updatedManagers = managers.map((m) => {
        if (m.id === data.managerId) {
          return { ...m, assignedStoreId: newStore.id, assignedStoreName: newStore.name };
        }
        return m;
      });
      db.setManagers(updatedManagers);
    }

    return newStore;
  },

  async updateStore(data: UpdateStoreDto): Promise<Store> {
    await delay();
    const stores = db.getStores();
    const managers = db.getManagers();
    const existing = stores.find((s) => s.id === data.id);
    if (!existing) throw new Error('Store not found');

    let managerName = existing.managerName;
    if (data.managerId !== undefined) {
      if (data.managerId) {
        const mgr = managers.find((m) => m.id === data.managerId);
        managerName = mgr?.name;
      } else {
        managerName = undefined;
      }
    }

    const updatedStore: Store = {
      ...existing,
      ...data,
      managerName,
    };

    const updated = stores.map((s) => (s.id === data.id ? updatedStore : s));
    db.setStores(updated);

    // Update manager assignments if changed
    if (data.managerId !== undefined && data.managerId !== existing.managerId) {
      const updatedManagers = managers.map((m) => {
        // Clear previous manager
        if (existing.managerId && m.id === existing.managerId) {
          return { ...m, assignedStoreId: undefined, assignedStoreName: undefined };
        }
        // Set new manager
        if (data.managerId && m.id === data.managerId) {
          return { ...m, assignedStoreId: updatedStore.id, assignedStoreName: updatedStore.name };
        }
        return m;
      });
      db.setManagers(updatedManagers);
    }

    return updatedStore;
  },

  async deleteStore(id: string): Promise<void> {
    await delay();
    const stores = db.getStores();
    const filtered = stores.filter((s) => s.id !== id);
    db.setStores(filtered);

    // Unassign managers associated with this store
    const managers = db.getManagers();
    const updatedManagers = managers.map((m) => {
      if (m.assignedStoreId === id) {
        return { ...m, assignedStoreId: undefined, assignedStoreName: undefined };
      }
      return m;
    });
    db.setManagers(updatedManagers);
  },

  async toggleStoreStatus(id: string): Promise<Store> {
    await delay();
    const stores = db.getStores();
    const target = stores.find((s) => s.id === id);
    if (!target) throw new Error('Store not found');

    const nextStatus: StoreStatus = target.status === 'Active' ? 'Inactive' : 'Active';
    const updated = stores.map((s) => (s.id === id ? { ...s, status: nextStatus } : s));
    db.setStores(updated);
    return { ...target, status: nextStatus };
  },

  async assignManager(storeId: string, managerId: string): Promise<Store> {
    return this.updateStore({ id: storeId, managerId });
  },
};
