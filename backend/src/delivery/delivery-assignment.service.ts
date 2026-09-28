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
    const currentOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, deliveryPartnerId: true },
    });
    if (
      !currentOrder ||
      (currentOrder.status !== OrderStatus.READY_FOR_PICKUP &&
        currentOrder.status !== OrderStatus.WAITING_FOR_PARTNER) ||
      currentOrder.deliveryPartnerId
    ) {
      return false;
    }

    let candidate: any = null;

    if (targetPartnerId) {
      candidate = await this.prisma.deliveryPartner.findUnique({
        where: { id: targetPartnerId },
      });
      if (
        candidate &&
        (!candidate.isActive ||
          candidate.onlineStatus !== OnlineStatus.ONLINE)
      ) {
        candidate = null;
      }
    }

    if (!candidate) {
      // 1. Find active, online delivery partners
      const eligiblePartners = await this.prisma.deliveryPartner.findMany({
        where: {
          isActive: true,
          onlineStatus: OnlineStatus.ONLINE,
        },
        take: 10,
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

    const pendingRequests = await this.prisma.deliveryRequest.findMany({
      where: { orderId, status: DeliveryRequestStatus.PENDING },
      include: { deliveryPartner: { select: { onlineStatus: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const existingRequest = await this.prisma.deliveryRequest.findFirst({
      where: {
        orderId,
        deliveryPartnerId: candidate.id,
        status: DeliveryRequestStatus.PENDING,
      },
      select: { id: true, expiresAt: true },
    });
    if (existingRequest) {
      await this.notifyPartner(candidate.id, orderId, existingRequest.id, existingRequest.expiresAt);
      return true;
    }
    if (pendingRequests.some((request) => request.deliveryPartner.onlineStatus === OnlineStatus.ONLINE)) {
      this.logger.log(`Keeping existing pending offer for order ${orderId}; its partner is still online`);
      return false;
    }

    // The required legacy expiry field is retained, but pending requests remain
    // available until the partner accepts or rejects them.
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const currentStatus = currentOrder.status;
    const [, , deliveryRequest] = await this.prisma.$transaction([
      this.prisma.deliveryRequest.updateMany({
        where: { orderId, status: DeliveryRequestStatus.PENDING },
        data: { status: DeliveryRequestStatus.CANCELLED },
      }),
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
          previousStatus: currentStatus,
          newStatus: OrderStatus.WAITING_FOR_PARTNER,
          metadata: { deliveryPartnerId: candidate.id },
        },
      }),
    ]);

    await this.notifyPartner(candidate.id, orderId, deliveryRequest.id, expiresAt);

    this.logger.log(`Delivery request for order ${orderId} sent to partner ${candidate.id}`);
    return true;
  }

  private async notifyPartner(
    partnerId: string,
    orderId: string,
    requestId: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: { select: { id: true, name: true, address: true, phone: true } },
          customer: { select: { name: true, phone: true } },
          orderItems: true,
        },
      });
      if (!order) {
        this.logger.error(`Cannot notify partner ${partnerId}: order ${orderId} was not found`);
        return;
      }

      this.realtimeGateway.emitDeliveryRequest(partnerId, {
        requestId,
        order,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (err) {
      this.logger.error(`Failed to notify partner ${partnerId} about request ${requestId}: ${(err as Error).message}`);
    }
  }
}
