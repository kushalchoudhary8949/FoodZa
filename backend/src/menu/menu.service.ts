import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import {
  CreateCategoryDto, UpdateCategoryDto,
  CreateMenuItemDto, UpdateMenuItemDto,
  UpdateAvailabilityDto,
} from './dto/menu.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: get full menu for a store */
  async getStoreMenu(storeId: string) {
    const store = await this.prisma.restaurant.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    return this.prisma.menuCategory.findMany({
      where: { restaurantId: storeId, isActive: true },
      include: {
        menuItems: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  // ── Categories ──

  async createCategory(storeId: string, dto: CreateCategoryDto, user: AuthenticatedUser) {
    this.enforceStoreAccess(user, storeId);
    return this.prisma.menuCategory.create({
      data: { restaurantId: storeId, ...dto },
    });
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto, user: AuthenticatedUser) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');
    this.enforceStoreAccess(user, category.restaurantId);

    return this.prisma.menuCategory.update({ where: { id: categoryId }, data: dto });
  }

  async deleteCategory(categoryId: string, user: AuthenticatedUser) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');
    this.enforceStoreAccess(user, category.restaurantId);

    // Soft delete
    return this.prisma.menuCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
    });
  }

  // ── Items ──

  async createItem(storeId: string, dto: CreateMenuItemDto, user: AuthenticatedUser) {
    this.enforceStoreAccess(user, storeId);

    // Verify category belongs to the store
    const category = await this.prisma.menuCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category || category.restaurantId !== storeId) {
      throw new NotFoundException('Category not found in this store');
    }

    return this.prisma.menuItem.create({
      data: {
        restaurantId: storeId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        price: dto.price,
        foodType: dto.foodType,
      },
    });
  }

  async updateItem(itemId: string, dto: UpdateMenuItemDto, user: AuthenticatedUser) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found');
    this.enforceStoreAccess(user, item.restaurantId);

    return this.prisma.menuItem.update({ where: { id: itemId }, data: dto });
  }

  async deleteItem(itemId: string, user: AuthenticatedUser) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found');
    this.enforceStoreAccess(user, item.restaurantId);

    // Soft delete
    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isActive: false },
    });
  }

  async updateAvailability(itemId: string, dto: UpdateAvailabilityDto, user: AuthenticatedUser) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found');
    this.enforceStoreAccess(user, item.restaurantId);

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: dto.isAvailable },
    });
  }

  private enforceStoreAccess(user: AuthenticatedUser, storeId: string) {
    if (user.role === 'ADMIN') return;
    if (user.role === 'MANAGER' && user.restaurantId !== storeId) {
      throw new ForbiddenException('You can only manage your own store menu');
    }
  }
}
