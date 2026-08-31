import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { StoresService } from './stores.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  /** GET /api/stores — public: list active stores */
  @Public()
  @Get()
  async findAll(@Query('all') all?: boolean) {
    return this.storesService.findAll(!all);
  }

  /** GET /api/stores/:id — public: get store details */
  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.storesService.findById(id);
  }

  /** POST /api/stores — admin only */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  /** PATCH /api/stores/:id — admin or own-store manager */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    this.enforceStoreAccess(user, id);
    return this.storesService.update(id, dto);
  }

  /** DELETE /api/stores/:id — admin only (soft deactivate) */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.storesService.deactivate(id);
  }

  /** POST /api/stores/:id/activate — admin only */
  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id') id: string) {
    return this.storesService.activate(id);
  }

  /** POST /api/stores/:id/toggle-open — own-store manager */
  @Post(':id/toggle-open')
  @Roles(UserRole.MANAGER)
  async toggleOpen(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.enforceStoreAccess(user, id);
    return this.storesService.toggleOpen(id);
  }

  /** Ensures a manager can only access their own store */
  private enforceStoreAccess(user: AuthenticatedUser, storeId: string) {
    if (user.role === 'ADMIN') return;
    if (user.role === 'MANAGER' && user.restaurantId !== storeId) {
      throw new ForbiddenException('You can only manage your own store');
    }
  }
}
