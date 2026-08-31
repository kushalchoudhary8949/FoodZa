import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SalesService } from './sales.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN)
  async getOverview() {
    return this.salesService.getPlatformOverview();
  }

  @Get('store/:storeId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStoreSales(@Param('storeId') storeId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.salesService.getStoreSales(storeId, user);
  }

  @Get('top-items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getTopItems(@CurrentUser() user: AuthenticatedUser, @Query('storeId') storeId?: string) {
    return this.salesService.getTopSellingItems(user, storeId);
  }
}
