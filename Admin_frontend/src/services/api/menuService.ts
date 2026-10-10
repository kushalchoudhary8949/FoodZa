import { MenuItem, MenuCategory } from '../../types';
import { AdminApiClient } from '../adminApi';

export interface CreateMenuItemDto {
  storeId: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  categoryId: string;
  isVeg: boolean;
  isAvailable?: boolean;
  preparationTimeMinutes?: number;
}

export interface UpdateMenuItemDto extends Partial<CreateMenuItemDto> {
  id: string;
}

export interface CreateCategoryDto {
  storeId: string;
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  id: string;
}

function mapBackendCategory(cat: any): MenuCategory {
  return {
    id: cat.id,
    storeId: cat.restaurantId,
    name: cat.name,
    description: cat.description || '',
    displayOrder: cat.displayOrder ?? 0,
  };
}

function mapBackendItem(item: any, categoryName?: string): MenuItem {
  return {
    id: item.id,
    storeId: item.restaurantId,
    name: item.name,
    description: item.description || '',
    image: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
    price: item.price,
    categoryId: item.categoryId,
    categoryName: categoryName || 'General',
    isVeg: item.foodType === 'VEG',
    isAvailable: item.isAvailable ?? true,
    preparationTimeMinutes: item.preparationTimeMinutes || 10,
  };
}

export const menuService = {
  // Categories
  async getCategoriesByStore(storeId: string): Promise<MenuCategory[]> {
    const rawCategories = await AdminApiClient.getStoreMenu(storeId);
    return rawCategories.map(mapBackendCategory).sort((a, b) => a.displayOrder - b.displayOrder);
  },

  async addCategory(data: CreateCategoryDto): Promise<MenuCategory> {
    const res = await AdminApiClient.createMenuCategory(data.storeId, {
      name: data.name,
      description: data.description,
      displayOrder: data.displayOrder,
    });
    return mapBackendCategory(res);
  },

  async createCategory(data: CreateCategoryDto): Promise<MenuCategory> {
    return this.addCategory(data);
  },

  async updateCategory(
    idOrData: string | UpdateCategoryDto,
    maybeNameOrData?: string | { name: string; description?: string; displayOrder?: number }
  ): Promise<MenuCategory> {
    let id: string;
    const payload: any = {};

    if (typeof idOrData === 'object') {
      id = idOrData.id;
      if (idOrData.name !== undefined) payload.name = idOrData.name;
      if (idOrData.description !== undefined) payload.description = idOrData.description;
      if (idOrData.displayOrder !== undefined) payload.displayOrder = idOrData.displayOrder;
    } else {
      id = idOrData;
      if (typeof maybeNameOrData === 'string') {
        payload.name = maybeNameOrData;
      } else if (maybeNameOrData) {
        if (maybeNameOrData.name !== undefined) payload.name = maybeNameOrData.name;
        if (maybeNameOrData.description !== undefined) payload.description = maybeNameOrData.description;
        if (maybeNameOrData.displayOrder !== undefined) payload.displayOrder = maybeNameOrData.displayOrder;
      }
    }

    const res = await AdminApiClient.updateMenuCategory(id, payload);
    return mapBackendCategory(res);
  },

  async deleteCategory(id: string): Promise<void> {
    await AdminApiClient.deleteMenuCategory(id);
  },

  // Menu Items
  async getMenuItemsByStore(storeId: string): Promise<MenuItem[]> {
    const rawCategories = await AdminApiClient.getStoreMenu(storeId);
    const items: MenuItem[] = [];
    for (const cat of rawCategories) {
      if (cat.menuItems) {
        for (const item of cat.menuItems) {
          items.push(mapBackendItem(item, cat.name));
        }
      }
    }
    return items;
  },

  async addMenuItem(data: CreateMenuItemDto): Promise<MenuItem> {
    const res = await AdminApiClient.createMenuItem(data.storeId, {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      imageUrl: data.image,
      price: Number(data.price),
      foodType: data.isVeg ? 'VEG' : 'NON_VEG',
      // The backend doesn't expect isAvailable on create, it defaults to true
      // But we can check if it supports it, actually backend DTO doesn't have it on create.
    });
    // Toggle availability immediately if created as false
    if (data.isAvailable === false) {
      await AdminApiClient.toggleMenuItemAvailability(res.id, false);
      res.isAvailable = false;
    }
    return mapBackendItem(res);
  },

  async createMenuItem(data: CreateMenuItemDto): Promise<MenuItem> {
    return this.addMenuItem(data);
  },

  async updateMenuItem(data: UpdateMenuItemDto): Promise<MenuItem> {
    const payload: any = {};
    if (data.categoryId !== undefined) payload.categoryId = data.categoryId;
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.image !== undefined) payload.imageUrl = data.image;
    if (data.price !== undefined) payload.price = Number(data.price);
    if (data.isVeg !== undefined) payload.foodType = data.isVeg ? 'VEG' : 'NON_VEG';
    if (data.isAvailable !== undefined) payload.isAvailable = data.isAvailable;

    const res = await AdminApiClient.updateMenuItem(data.id, payload);
    return mapBackendItem(res);
  },

  async deleteMenuItem(id: string): Promise<void> {
    await AdminApiClient.deleteMenuItem(id);
  },

  async toggleAvailability(id: string, isAvailable: boolean): Promise<MenuItem> {
    const res = await AdminApiClient.toggleMenuItemAvailability(id, isAvailable);
    return mapBackendItem(res);
  },
};
