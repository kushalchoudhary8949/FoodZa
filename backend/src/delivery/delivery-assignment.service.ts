import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnlineStatus, DeliveryRequestStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class DeliveryAssignmentService {
  private readonly logger = new Logger(DeliveryAssignmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find eligible online delivery partners and send a delivery request
   */
  async assignDelivery(orderId: string): Promise<boolean> {
    // 1. Find active, online delivery partners who don't have an active request/order
    const eligiblePartners = await this.prisma.deliveryPartner.findMany({
      where: {
        isActive: true,
        onlineStatus: OnlineStatus.ONLINE,
        currentOrderId: null,
      },
      take: 5,
    });

    if (eligiblePartners.length === 0) {
      this.logger.warn(`No active online partners available for order ${orderId}`);
      return false;
    }

    // Filter out partners who previously rejected this order
    const previousRequests = await this.prisma.deliveryRequest.findMany({
      where: { orderId },
      select: { deliveryPartnerId: true },
    });
    const rejectedPartnerIds = new Set(previousRequests.map((r) => r.deliveryPartnerId));

    const candidate = eligiblePartners.find((p) => !rejectedPartnerIds.has(p.id));

    if (!candidate) {
      this.logger.warn(`All online partners have already rejected order ${orderId}`);
      return false;
    }

    // Create delivery request expiring in 30 seconds
    const expiresAt = new Date(Date.now() + 30 * 1000);

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.WAITING_FOR_PARTNER },
      }),
      this.prisma.deliveryRequest.create({
        data: {
          orderId,
          deliveryPartnerId: candidate.id,
          expiresAt,
          status: DeliveryRequestStatus.PENDING,
        },
      }),
    ]);

    this.logger.log(`Delivery request for order ${orderId} sent to partner ${candidate.id}`);
    return true;
  }
}
