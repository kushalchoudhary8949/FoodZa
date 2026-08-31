import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRole, OrderStatus, IssueStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryPartnerDto, UpdateDeliveryPartnerDto } from './dto/admins.dto';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    const [
      totalStores,
      totalCustomers,
      totalPartners,
      activePartners,
      pendingOrders,
      totalDeliveredOrders,
      openIssues,
      deliveredOrders,
    ] = await Promise.all([
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.customer.count(),
      this.prisma.deliveryPartner.count(),
      this.prisma.deliveryPartner.count({ where: { onlineStatus: 'ONLINE', isActive: true } }),
      this.prisma.order.count({
        where: {
          status: {
            in: [OrderStatus.WAITING_FOR_MANAGER, OrderStatus.WAITING_FOR_ADMIN, OrderStatus.WAITING_FOR_PARTNER],
          },
        },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.issue.count({ where: { status: IssueStatus.OPEN } }),
      this.prisma.order.findMany({
        where: { status: OrderStatus.DELIVERED },
        select: { totalAmount: true },
      }),
    ]);

    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return {
      totalStores,
      totalCustomers,
      totalPartners,
      activePartners,
      pendingOrders,
      totalDeliveredOrders,
      openIssues,
      totalRevenue,
    };
  }

  // ── Delivery Partner Admin Operations ──

  async findAllPartners() {
    return this.prisma.deliveryPartner.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPartner(dto: CreateDeliveryPartnerDto) {
    const existing = await this.prisma.user.findUnique({ where: { firebaseUid: dto.firebaseUid } });
    if (existing) throw new ConflictException('User with this Firebase UID already exists');

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firebaseUid: dto.firebaseUid,
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          role: UserRole.DELIVERY_PARTNER,
        },
      });

      const partner = await tx.deliveryPartner.create({
        data: {
          userId: user.id,
          phone: dto.phone,
        },
      });

      return { ...partner, user };
    });
  }

  async updatePartner(partnerId: string, dto: UpdateDeliveryPartnerDto) {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Delivery partner not found');

    return this.prisma.user.update({
      where: { id: partner.userId },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
      },
    });
  }

  async activatePartner(partnerId: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Delivery partner not found');

    return this.prisma.$transaction([
      this.prisma.user.update({ where: { id: partner.userId }, data: { isActive: true } }),
      this.prisma.deliveryPartner.update({ where: { id: partnerId }, data: { isActive: true } }),
    ]);
  }

  async deactivatePartner(partnerId: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Delivery partner not found');

    return this.prisma.$transaction([
      this.prisma.user.update({ where: { id: partner.userId }, data: { isActive: false } }),
      this.prisma.deliveryPartner.update({ where: { id: partnerId }, data: { isActive: false } }),
    ]);
  }

  // ── Audit Logs ──

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      include: { actor: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
