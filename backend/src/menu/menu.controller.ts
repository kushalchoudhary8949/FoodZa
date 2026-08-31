import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { MenuService } from './menu.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import {
  CreateCategoryDto, UpdateCategoryDto,
  CreateMenuItemDto, UpdateMenuItemDto,
  UpdateAvailabilityDto,
} from './dto/menu.dto';

@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /** GET /api/stores/:storeId/menu — public */
  @Public()
  @Get('stores/:storeId/menu')
  async getStoreMenu(@Param('storeId') storeId: string) {
    return this.menuService.getStoreMenu(storeId);
  }

  // ── Categories ──

  @Post('stores/:storeId/menu/categories')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createCategory(
    @Param('storeId') storeId: string,
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.createCategory(storeId, dto, user);
  }

  @Patch('menu/categories/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.updateCategory(id, dto, user);
  }

  @Delete('menu/categories/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteCategory(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.menuService.deleteCategory(id, user);
  }

  // ── Items ──

  @Post('stores/:storeId/menu/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createItem(
    @Param('storeId') storeId: string,
    @Body() dto: CreateMenuItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.createItem(storeId, dto, user);
  }

  @Patch('menu/items/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.updateItem(id, dto, user);
  }

  @Delete('menu/items/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteItem(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.menuService.deleteItem(id, user);
  }

  @Patch('menu/items/:id/availability')
  @Roles(UserRole.MANAGER)
  async updateAvailability(
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.updateAvailability(id, dto, user);
  }
}
