import { MenuItem, MenuCategory } from '../../types';
import { db } from '../storage';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const menuService = {
  // Categories
  async getCategoriesByStore(storeId: string): Promise<MenuCategory[]> {
    await delay();
    const categories = db.getCategories();
    return categories
      .filter((c) => c.storeId === storeId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },

  async addCategory(data: CreateCategoryDto): Promise<MenuCategory> {
    await delay();
    const categories = db.getCategories();
    const storeCategories = categories.filter((c) => c.storeId === data.storeId);

    const newCategory: MenuCategory = {
      id: `cat_${data.storeId}_${Date.now()}`,
      storeId: data.storeId,
      name: data.name.trim(),
      displayOrder: data.displayOrder ?? storeCategories.length + 1,
    };

    const updated = [...categories, newCategory];
    db.setCategories(updated);
    return newCategory;
  },

  async createCategory(data: CreateCategoryDto): Promise<MenuCategory> {
    return this.addCategory(data);
  },

  async updateCategory(
    idOrData: string | UpdateCategoryDto,
    maybeNameOrData?: string | { name: string; description?: string; displayOrder?: number }
  ): Promise<MenuCategory> {
    await delay();
    const categories = db.getCategories();

    let id: string;
    let name: string | undefined;
    let description: string | undefined;
    let displayOrder: number | undefined;

    if (typeof idOrData === 'object') {
      id = idOrData.id;
      name = idOrData.name;
      description = idOrData.description;
      displayOrder = idOrData.displayOrder;
    } else {
      id = idOrData;
      if (typeof maybeNameOrData === 'string') {
        name = maybeNameOrData;
      } else if (maybeNameOrData) {
        name = maybeNameOrData.name;
        description = maybeNameOrData.description;
        displayOrder = maybeNameOrData.displayOrder;
      }
    }

    const target = categories.find((c) => c.id === id);
    if (!target) throw new Error('Category not found');

    const updatedCat: MenuCategory = {
      ...target,
      name: name !== undefined ? name.trim() : target.name,
      description: description !== undefined ? description.trim() : target.description,
      displayOrder: displayOrder !== undefined ? displayOrder : target.displayOrder,
    };

    const updated = categories.map((c) => (c.id === id ? updatedCat : c));
    db.setCategories(updated);
    return updatedCat;
  },

  async deleteCategory(id: string): Promise<void> {
    await delay();
    const categories = db.getCategories();
    const filtered = categories.filter((c) => c.id !== id);
    db.setCategories(filtered);

    // Also remove items belonging to this category or reassign
    const items = db.getMenuItems();
    const filteredItems = items.filter((item) => item.categoryId !== id);
    db.setMenuItems(filteredItems);
  },

  // Menu Items
  async getMenuItemsByStore(storeId: string): Promise<MenuItem[]> {
    await delay();
    const items = db.getMenuItems();
    const categories = db.getCategories();

    return items
      .filter((item) => item.storeId === storeId)
      .map((item) => {
        const cat = categories.find((c) => c.id === item.categoryId);
        return {
          ...item,
          categoryName: cat?.name || 'General',
        };
      });
  },

  async addMenuItem(data: CreateMenuItemDto): Promise<MenuItem> {
    await delay();
    const items = db.getMenuItems();
    const categories = db.getCategories();
    const category = categories.find((c) => c.id === data.categoryId);

    const newItem: MenuItem = {
      id: `item_${data.storeId}_${Date.now()}`,
      storeId: data.storeId,
      name: data.name.trim(),
      description: data.description.trim(),
      image: data.image?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
      price: Number(data.price),
      categoryId: data.categoryId,
      categoryName: category?.name || 'General',
      isVeg: Boolean(data.isVeg),
      isAvailable: data.isAvailable ?? true,
      preparationTimeMinutes: data.preparationTimeMinutes || 10,
    };

    const updated = [newItem, ...items];
    db.setMenuItems(updated);
    return newItem;
  },

  async createMenuItem(data: CreateMenuItemDto): Promise<MenuItem> {
    return this.addMenuItem(data);
  },

  async updateMenuItem(data: UpdateMenuItemDto): Promise<MenuItem> {
    await delay();
    const items = db.getMenuItems();
    const categories = db.getCategories();
    const existing = items.find((i) => i.id === data.id);
    if (!existing) throw new Error('Menu item not found');

    const category = data.categoryId
      ? categories.find((c) => c.id === data.categoryId)
      : categories.find((c) => c.id === existing.categoryId);

    const updatedItem: MenuItem = {
      ...existing,
      ...data,
      price: data.price !== undefined ? Number(data.price) : existing.price,
      categoryName: category?.name || existing.categoryName,
    };

    const updated = items.map((i) => (i.id === data.id ? updatedItem : i));
    db.setMenuItems(updated);
    return updatedItem;
  },

  async deleteMenuItem(id: string): Promise<void> {
    await delay();
    const items = db.getMenuItems();
    const filtered = items.filter((i) => i.id !== id);
    db.setMenuItems(filtered);
  },

  async toggleAvailability(id: string): Promise<MenuItem> {
    await delay();
    const items = db.getMenuItems();
    const target = items.find((i) => i.id === id);
    if (!target) throw new Error('Menu item not found');

    const nextAvailable = !target.isAvailable;
    const updatedItem = { ...target, isAvailable: nextAvailable };
    const updated = items.map((i) => (i.id === id ? updatedItem : i));
    db.setMenuItems(updated);
    return updatedItem;
  },
};
