import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Platform-wide sales summary for Admin
   */
  async getPlatformOverview() {
    const deliveredOrders = await this.prisma.order.findMany({
      where: { status: OrderStatus.DELIVERED },
      select: { totalAmount: true, subtotal: true },
    });

    const totalOrdersCount = deliveredOrders.length;
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    return {
      totalOrdersCount,
      totalRevenue,
      averageOrderValue,
    };
  }

  /**
   * Store-specific sales analytics (Admin or Store Manager for own store)
   */
  async getStoreSales(storeId: string, user: AuthenticatedUser) {
    if (user.role === UserRole.MANAGER && user.restaurantId !== storeId) {
      throw new ForbiddenException('Access denied: You can only view sales for your assigned store');
    }

    const deliveredOrders = await this.prisma.order.findMany({
      where: {
        restaurantId: storeId,
        status: OrderStatus.DELIVERED,
      },
      select: {
        id: true,
        totalAmount: true,
        subtotal: true,
        createdAt: true,
      },
    });

    const totalOrdersCount = deliveredOrders.length;
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    return {
      storeId,
      totalOrdersCount,
      totalRevenue,
      averageOrderValue,
    };
  }

  /**
   * Top selling items report
   */
  async getTopSellingItems(user: AuthenticatedUser, storeId?: string) {
    const targetStoreId = user.role === UserRole.MANAGER ? user.restaurantId : storeId;

    const orderItems = await this.prisma.orderItem.groupBy({
      by: ['itemNameSnapshot'],
      where: {
        order: {
          status: OrderStatus.DELIVERED,
          restaurantId: targetStoreId,
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    return orderItems.map((item) => ({
      itemName: item.itemNameSnapshot,
      totalQuantitySold: item._sum.quantity || 0,
      totalRevenue: Number(item._sum.totalPrice || 0),
    }));
  }
}
