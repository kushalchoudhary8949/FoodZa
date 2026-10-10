import { Store, StoreStatus } from '../../types';
import { AdminApiClient } from '../adminApi';
import { db } from '../storage';

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

/** Map a backend restaurant row into the admin‑panel Store shape */
function mapBackendToStore(s: any): Store {
  return {
    id: s.id,
    name: s.name,
    logo: s.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
    description: s.description || '',
    location: s.address || '',
    contactNumber: s.phone || '',
    openingTime: s.openingTime || '10:00 AM',
    closingTime: s.closingTime || '11:00 PM',
    status: s.isActive === false ? 'Inactive' : 'Active',
    managerId: s.managers?.[0]?.id,
    managerName: s.managers?.[0]?.user?.name,
    rating: 4.5,
    totalOrders: 0,
    totalSales: 0,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

/** Convert admin‑panel fields into the backend store DTO shape.
 * NOTE: Admin "Active / Inactive" status reflects Restaurant.isActive and is
 * applied via the dedicated POST /stores/:id/activate and DELETE /stores/:id
 * endpoints — never as a PATCH/POST body field. Sending `isOpen` here both
 * trips `forbidNonWhitelisted` on POST (CreateStoreDto has no such field:
 * "property isOpen should not exist") and would toggle the wrong column
 * (open-for-orders vs enabled/listed). See mapBackendToStore above. */
function toBackendPayload(data: Partial<CreateStoreDto>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.description !== undefined) payload.description = data.description.trim();
  if (data.logo !== undefined) payload.imageUrl = data.logo.trim();
  if (data.location !== undefined) payload.address = data.location.trim();
  if (data.contactNumber !== undefined) payload.phone = data.contactNumber.trim();
  if (data.openingTime !== undefined) payload.openingTime = data.openingTime;
  if (data.closingTime !== undefined) payload.closingTime = data.closingTime;
  return payload;
}

/** Generate a URL‑friendly slug from a store name */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}

/** Backend Manager IDs are Prisma cuids; local mock IDs look like `mgr_rahul`.
 *  Assigning a local-only manager to a backend store always 404s with
 *  "Manager not found" — detect it early for a clearer warning. */
function isLocalOnlyManagerId(id: string): boolean {
  return id.startsWith('mgr_') || id.includes('_') || id.length < 20;
}

/** Keep the local cache consistent even when the backend link fails,
 *  so the UI still shows the chosen manager on the store. */
function syncLocalManagerLink(storeId: string, storeName: string, managerId: string) {
  try {
    const managers = db.getManagers();
    const mgr = managers.find((m) => m.id === managerId);
    const stores = db.getStores();
    db.setStores(stores.map((s) =>
      s.id === storeId ? { ...s, managerId, managerName: mgr?.name } : s
    ));
    if (mgr) {
      db.setManagers(managers.map((m) =>
        m.id === managerId ? { ...m, assignedStoreId: storeId, assignedStoreName: storeName } : m
      ));
    }
  } catch { /* local sync must never throw */ }
}

/** Try the backend link; fall back to a local-only link with a clear warning
 *  instead of the raw "Manager not found" console error. */
async function linkManagerBackend(storeId: string, storeName: string, managerId: string, action: string) {
  if (isLocalOnlyManagerId(managerId)) {
    console.warn(
      `${action}: manager "${managerId}" exists only in local mock data, not on the backend — ` +
      `skipping backend link, saving assignment locally. Create the manager on the backend first to persist it.`
    );
    syncLocalManagerLink(storeId, storeName, managerId);
    return;
  }
  try {
    await AdminApiClient.assignStoreToManager(managerId, storeId);
    syncLocalManagerLink(storeId, storeName, managerId);
  } catch (e: any) {
    console.warn(
      `${action}: backend link failed (${e?.message || e}), saving assignment locally instead. ` +
      `Store is created — re-assign once the manager exists on the backend.`
    );
    syncLocalManagerLink(storeId, storeName, managerId);
  }
}

export const storeService = {
  async getStores(): Promise<Store[]> {
    try {
      const data = await AdminApiClient.getStores();
      if (data && Array.isArray(data) && data.length > 0) {
        const backendStores = data.map(mapBackendToStore);
        // Sync localStorage so other parts of admin can see them
        db.setStores(backendStores);
        return backendStores;
      }
    } catch (err) {
      console.warn('Backend store fetch failed, falling back to local:', err);
    }
    // Fallback to local if backend is unreachable
    return db.getStores();
  },

  async getStoreById(id: string): Promise<Store | undefined> {
    const stores = await this.getStores();
    return stores.find((s) => s.id === id);
  },

  async createStore(data: CreateStoreDto): Promise<Store> {
    try {
      const payload = {
        ...toBackendPayload(data),
        slug: slugify(data.name),
      };
      const created: any = await AdminApiClient.createStore(payload);

      // Apply Active/Inactive via dedicated endpoint (works on all backend versions)
      if (data.status === 'Inactive') {
        try {
          await AdminApiClient.deactivateStore(created.id);
        } catch (e) {
          console.warn('Store deactivation failed:', e);
        }
      }

      // If a manager was assigned, link them (backend + local fallback)
      if (data.managerId) {
        await linkManagerBackend(created.id, created.name || data.name, data.managerId, 'Manager assignment');
      }

      const store = mapBackendToStore(created);
      // deactivateStore above doesn't mutate `created`, so force the requested status
      if (data.status !== undefined) store.status = data.status;
      // Reflect the (possibly local-only) manager link on the returned store
      if (data.managerId) {
        const mgr = db.getManagers().find((m) => m.id === data.managerId);
        store.managerId = data.managerId;
        if (mgr) store.managerName = mgr.name;
      }

      // Also sync to localStorage for reactive UI
      const stores = db.getStores();
      db.setStores([store, ...stores]);
      return store;
    } catch (err: any) {
      console.error('Backend create failed:', err);
      throw err;
    }
  },

  async updateStore(data: UpdateStoreDto): Promise<Store> {
    try {
      const payload = toBackendPayload(data);
      const updated = await AdminApiClient.updateStore(data.id, payload);

      // Apply Active/Inactive via dedicated endpoints (never via PATCH body)
      if (data.status !== undefined) {
        try {
          if (data.status === 'Inactive') {
            await AdminApiClient.deactivateStore(data.id);
          } else {
            await AdminApiClient.activateStore(data.id);
          }
        } catch (e) {
          console.warn('Store status sync failed:', e);
        }
      }

      // If manager changed, reassign (backend + local fallback)
      if (data.managerId !== undefined && data.managerId) {
        await linkManagerBackend(data.id, (updated as any)?.name || '', data.managerId, 'Manager reassignment');
      }

      const store = mapBackendToStore(updated);
      // activate/deactivate above doesn't mutate `updated`, so force requested status
      if (data.status !== undefined) store.status = data.status;
      // Reflect the (possibly local-only) manager link on the returned store
      if (data.managerId) {
        const mgr = db.getManagers().find((m) => m.id === data.managerId);
        store.managerId = data.managerId;
        if (mgr) store.managerName = mgr.name;
      }

      // Sync to localStorage
      const stores = db.getStores();
      db.setStores(stores.map((s) => (s.id === data.id ? store : s)));
      return store;
    } catch (err: any) {
      console.error('Backend update failed:', err);
      throw err;
    }
  },

  async deleteStore(id: string): Promise<void> {
    try {
      await AdminApiClient.deactivateStore(id);
    } catch (err: any) {
      console.error('Backend deactivate failed:', err);
      throw err;
    }
    // Remove from local
    const stores = db.getStores();
    db.setStores(stores.filter((s) => s.id !== id));
  },

  async toggleStoreStatus(id: string): Promise<Store> {
    const stores = db.getStores();
    const target = stores.find((s) => s.id === id);
    if (!target) throw new Error('Store not found');

    const isCurrentlyActive = target.status === 'Active';

    try {
      if (isCurrentlyActive) {
        await AdminApiClient.deactivateStore(id);
      } else {
        await AdminApiClient.activateStore(id);
      }
    } catch (err: any) {
      console.error('Backend toggle failed:', err);
      throw err;
    }

    const nextStatus: StoreStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    const updated = stores.map((s) => (s.id === id ? { ...s, status: nextStatus } : s));
    db.setStores(updated);
    return { ...target, status: nextStatus };
  },

  async assignManager(storeId: string, managerId: string): Promise<Store> {
    return this.updateStore({ id: storeId, managerId });
  },
};
