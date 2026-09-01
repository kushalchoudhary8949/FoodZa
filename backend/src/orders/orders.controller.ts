import { Controller, Get, Post, Param, Body, Query, ForbiddenException } from '@nestjs/common';
import { UserRole, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateOrderDto, ManagerActionDto, AdminActionDto } from './dto/order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  async createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.customerId || user.id, dto);
  }

  @Get('my-orders')
  @Roles(UserRole.CUSTOMER)
  async getMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findCustomerOrders(user.customerId!);
  }

  @Get('store-orders')
  @Roles(UserRole.MANAGER)
  async getStoreOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findStoreOrders(user.restaurantId!, status);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async getAdminOrders(
    @Query('status') status?: OrderStatus,
    @Query('storeId') storeId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.ordersService.findAllAdmin({ status, storeId, customerId });
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findById(id, user);
  }

  @Post(':id/manager/accept')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async managerAccept(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto?: ManagerActionDto,
  ) {
    return this.ordersService.managerAccept(id, user.restaurantId!, user, dto);
  }

  @Post(':id/manager/reject')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async managerReject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto?: ManagerActionDto,
  ) {
    return this.ordersService.managerReject(id, user.restaurantId!, user, dto);
  }

  @Post(':id/admin/accept')
  @Roles(UserRole.ADMIN)
  async adminAccept(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto?: AdminActionDto,
  ) {
    return this.ordersService.adminAccept(id, user, dto);
  }

  @Post(':id/admin/reject')
  @Roles(UserRole.ADMIN)
  async adminReject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto?: AdminActionDto,
  ) {
    return this.ordersService.adminReject(id, user, dto);
  }

  @Post(':id/preparing')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async markPreparing(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.markPreparing(id, user);
  }

  @Post(':id/ready')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async markReady(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.markReady(id, user);
  }
}
