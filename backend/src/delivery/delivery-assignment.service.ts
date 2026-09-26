import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { OnlineStatus, DeliveryRequestStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class DeliveryAssignmentService {
  private readonly logger = new Logger(DeliveryAssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Find eligible online delivery partners and send a delivery request
   */
  async assignDelivery(orderId: string, targetPartnerId?: string): Promise<boolean> {
    let candidate: any = null;

    if (targetPartnerId) {
      candidate = await this.prisma.deliveryPartner.findUnique({
        where: { id: targetPartnerId },
      });
      if (candidate) {
        // Ensure candidate partner is active and online
        if (!candidate.isActive || candidate.onlineStatus !== OnlineStatus.ONLINE) {
          candidate = await this.prisma.deliveryPartner.update({
            where: { id: targetPartnerId },
            data: { isActive: true, onlineStatus: OnlineStatus.ONLINE, currentOrderId: null },
          });
        }
      }
    }

    if (!candidate) {
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
        where: { orderId, status: DeliveryRequestStatus.REJECTED },
        select: { deliveryPartnerId: true },
      });
      const rejectedPartnerIds = new Set(previousRequests.map((r) => r.deliveryPartnerId));

      candidate = eligiblePartners.find((p) => !rejectedPartnerIds.has(p.id));
    }

    if (!candidate) {
      this.logger.warn(`No online delivery partners available for order ${orderId}; assignment will retry when a partner comes online`);
      return false;
    }

    const existingRequest = await this.prisma.deliveryRequest.findFirst({
      where: {
        orderId,
        deliveryPartnerId: candidate.id,
        status: DeliveryRequestStatus.PENDING,
      },
      select: { id: true },
    });
    if (existingRequest) {
      return true;
    }

    // The required legacy expiry field is retained, but pending requests remain
    // available until the partner accepts or rejects them.
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const currentOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    const [, deliveryRequest] = await this.prisma.$transaction([
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
      this.prisma.orderEvent.create({
        data: {
          orderId,
          eventType: 'WAITING_FOR_PARTNER',
          previousStatus: currentOrder?.status,
          newStatus: OrderStatus.WAITING_FOR_PARTNER,
          metadata: { deliveryPartnerId: candidate.id },
        },
      }),
    ]);

    // Fetch full order with relations for the Socket.IO payload
    const fullOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: { select: { id: true, name: true, address: true, phone: true } },
        customer: { select: { name: true, phone: true } },
        orderItems: true,
      },
    });

    // Emit real-time delivery request to the assigned partner
    try {
      this.realtimeGateway.emitDeliveryRequest(candidate.id, {
        requestId: deliveryRequest.id,
        order: fullOrder,
        expiresAt: expiresAt.toISOString(),
      });
      this.realtimeGateway.emitOrderUpdate(
        orderId,
        fullOrder?.restaurantId || '',
        'WAITING_FOR_PARTNER',
        fullOrder,
      );
    } catch (err: any) {
      this.logger.warn(`Failed to emit delivery:request to partner ${candidate.id}: ${err.message}`);
    }

    this.logger.log(`Delivery request for order ${orderId} sent to partner ${candidate.id}`);
    return true;
  }
}
