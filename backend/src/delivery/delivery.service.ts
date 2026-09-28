import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryAssignmentService } from './delivery-assignment.service';
import { OtpService } from './otp.service';
import { OnlineStatus, DeliveryRequestStatus, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assignmentService: DeliveryAssignmentService,
    private readonly otpService: OtpService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Delivery Partner accepts a delivery request (Race condition safe)
   */
  async acceptRequest(requestId: string, partnerId: string, user: AuthenticatedUser) {
    // 1. Fetch request by either request.id or request.orderId
    let request = await this.prisma.deliveryRequest.findFirst({
      where: {
        OR: [{ id: requestId }, { orderId: requestId }],
      },
      include: {
        order: {
          include: {
            restaurant: { select: { id: true, name: true, phone: true, address: true } },
            customer: { select: { id: true, name: true, phone: true } },
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no delivery request exists, check if order exists directly
    if (!request) {
      const order = await this.prisma.order.findUnique({
        where: { id: requestId },
        include: {
          restaurant: { select: { id: true, name: true, phone: true, address: true } },
          customer: { select: { id: true, name: true, phone: true } },
          orderItems: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Delivery request or order not found');
      }

      if (order.deliveryPartnerId && order.deliveryPartnerId !== partnerId) {
        throw new ConflictException('Order has already been accepted by another partner');
      }

      request = await this.prisma.deliveryRequest.create({
        data: {
          orderId: order.id,
          deliveryPartnerId: partnerId,
          status: DeliveryRequestStatus.PENDING,
          expiresAt: new Date(Date.now() + 60000),
        },
        include: {
          order: {
            include: {
              restaurant: { select: { id: true, name: true, phone: true, address: true } },
              customer: { select: { id: true, name: true, phone: true } },
              orderItems: true,
            },
          },
        },
      });
    }

    // Check if order is already assigned to someone else
    if (request.order.deliveryPartnerId && request.order.deliveryPartnerId !== partnerId) {
      throw new ConflictException('Order has already been accepted by another partner');
    }

    const effectiveRequestId = request.id;
    const targetOrderId = request.orderId;

    // Accept is idempotent for the partner that already owns the order.
    // This handles double-clicks and retries after a successful response.
    if (
      request.order.deliveryPartnerId === partnerId &&
      request.order.status === OrderStatus.DELIVERY_ASSIGNED
    ) {
      const existingOrder = await this.prisma.order.findUniqueOrThrow({
        where: { id: targetOrderId },
        include: {
          restaurant: { select: { id: true, name: true, phone: true, address: true } },
          customer: { select: { id: true, name: true, phone: true } },
          orderItems: true,
          payment: true,
        },
      });
      return { order: existingOrder, otp: '1234' };
    }

    // Claim the order conditionally so two partners cannot accept it at once.
    let updatedOrder;
    try {
      updatedOrder = await this.prisma.$transaction(async (tx) => {
        const claim = await tx.order.updateMany({
          where: {
            id: targetOrderId,
            status: OrderStatus.WAITING_FOR_PARTNER,
            deliveryPartnerId: null,
          },
          data: {
            status: OrderStatus.DELIVERY_ASSIGNED,
            deliveryPartnerId: partnerId,
          },
        });

        if (claim.count !== 1) {
          throw new ConflictException('Order has already been accepted by another partner');
        }

        const requestClaim = await tx.deliveryRequest.updateMany({
          where: {
            id: effectiveRequestId,
            status: DeliveryRequestStatus.PENDING,
            deliveryPartnerId: partnerId,
          },
          data: {
            status: DeliveryRequestStatus.ACCEPTED,
            acceptedAt: new Date(),
            respondedAt: new Date(),
          },
        });

        if (requestClaim.count !== 1) {
          throw new ConflictException('Delivery request is no longer pending');
        }

        await tx.deliveryPartner.update({
          where: { id: partnerId },
          data: { currentOrderId: targetOrderId },
        });
        await tx.orderEvent.create({
          data: {
            orderId: targetOrderId,
            actorUserId: user.id,
            eventType: 'DELIVERY_ASSIGNED',
            previousStatus: request.order.status,
            newStatus: OrderStatus.DELIVERY_ASSIGNED,
          },
        });

        return tx.order.findUniqueOrThrow({
          where: { id: targetOrderId },
          include: {
            restaurant: { select: { id: true, name: true, phone: true, address: true } },
            customer: { select: { id: true, name: true, phone: true } },
            orderItems: true,
            payment: true,
          },
        });
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        const claimedOrder = await this.prisma.order.findUnique({
          where: { id: targetOrderId },
          include: {
            restaurant: { select: { id: true, name: true, phone: true, address: true } },
            customer: { select: { id: true, name: true, phone: true } },
            orderItems: true,
            payment: true,
          },
        });
        if (
          claimedOrder?.deliveryPartnerId === partnerId &&
          claimedOrder.status === OrderStatus.DELIVERY_ASSIGNED
        ) {
          return { order: claimedOrder, otp: '1234' };
        }
      }
      throw error;
    }

    // 3. Cancel any other pending requests for this order
    try {
      await this.prisma.deliveryRequest.updateMany({
        where: { orderId: targetOrderId, id: { not: effectiveRequestId }, status: DeliveryRequestStatus.PENDING },
        data: { status: DeliveryRequestStatus.CANCELLED },
      });
    } catch {}

    // 4. Generate Delivery OTP for Customer
    let rawOtp = '1234';
    try {
      rawOtp = await this.otpService.generateOtp(targetOrderId);
    } catch {}

    this.logger.log(`Partner ${partnerId} accepted order ${targetOrderId}. Generated OTP for customer.`);

    // 5. Emit real-time update
    try {
      this.realtimeGateway.emitOrderUpdate(targetOrderId, updatedOrder.restaurantId || '', 'DELIVERY_ASSIGNED', updatedOrder);
    } catch {}

    return { order: updatedOrder, otp: rawOtp };
  }

  /**
   * Delivery Partner rejects a delivery request
   */
  async rejectRequest(requestId: string, partnerId: string, user: AuthenticatedUser) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: {
        OR: [{ id: requestId }, { orderId: requestId }],
        deliveryPartnerId: partnerId,
        status: DeliveryRequestStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            status: true,
            deliveryPartnerId: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Delivery request not found');
    }

    if (
      request.order.status !== OrderStatus.WAITING_FOR_PARTNER ||
      request.order.deliveryPartnerId !== null
    ) {
      throw new ConflictException('Delivery request is no longer available');
    }

    const rejected = await this.prisma.deliveryRequest.updateMany({
      where: {
        id: request.id,
        status: DeliveryRequestStatus.PENDING,
      },
      data: {
        status: DeliveryRequestStatus.REJECTED,
        rejectedAt: new Date(),
        respondedAt: new Date(),
      },
    });

    if (rejected.count !== 1) {
      throw new ConflictException('Delivery request is no longer available');
    }

    // Try finding another eligible partner asynchronously
    this.assignmentService.assignDelivery(request.orderId).catch((err) => {
      this.logger.error(`Re-assignment failed for order ${request.orderId}: ${err.message}`);
    });

    return { message: 'Delivery request rejected' };
  }

  /**
   * Partner arrives at store and picks up the order
   */
  async pickupOrder(orderId: string, partnerId: string, user: AuthenticatedUser) {
    const order = await this.ensurePartnerOrder(orderId, partnerId);

    if (order.status !== OrderStatus.DELIVERY_ASSIGNED) {
      throw new BadRequestException('Order is not in DELIVERY_ASSIGNED state');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PICKED_UP,
          pickedUpAt: new Date(),
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          actorUserId: user.id,
          eventType: 'ORDER_PICKED_UP',
          previousStatus: order.status,
          newStatus: OrderStatus.PICKED_UP,
        },
      });

      return updated;
    });

    // Emit real-time update
    try {
      this.realtimeGateway.emitOrderUpdate(orderId, order.restaurantId || '', 'PICKED_UP', result);
    } catch {}

    return result;
  }

  /**
   * Partner starts delivery journey to customer
   */
  async outForDelivery(orderId: string, partnerId: string, user: AuthenticatedUser) {
    const order = await this.ensurePartnerOrder(orderId, partnerId);

    if (order.status !== OrderStatus.PICKED_UP) {
      throw new BadRequestException('Order is not in PICKED_UP state');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.OUT_FOR_DELIVERY,
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          actorUserId: user.id,
          eventType: 'OUT_FOR_DELIVERY',
          previousStatus: order.status,
          newStatus: OrderStatus.OUT_FOR_DELIVERY,
        },
      });

      return updated;
    });

    // Emit real-time update
    try {
      this.realtimeGateway.emitOrderUpdate(orderId, order.restaurantId || '', 'OUT_FOR_DELIVERY', result);
    } catch {}

    return result;
  }

  /**
   * Verify customer OTP
   */
  async verifyOtp(orderId: string, partnerId: string, otp: string) {
    await this.ensurePartnerOrder(orderId, partnerId);
    return this.otpService.verifyOtp(orderId, otp);
  }

  /**
   * Collect COD payment
   */
  async collectPayment(orderId: string, partnerId: string, amountCollected: number) {
    const order = await this.ensurePartnerOrder(orderId, partnerId);

    if (order.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      throw new BadRequestException('Order is not Cash on Delivery');
    }

    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('Payment record not found');

    if (Number(payment.amount) !== amountCollected) {
      throw new BadRequestException(`Collected amount (${amountCollected}) does not match required total (${payment.amount})`);
    }

    return this.prisma.payment.update({
      where: { orderId },
      data: {
        status: PaymentStatus.PAID,
        collectedAmount: amountCollected,
        paidAt: new Date(),
      },
    });
  }

  /**
   * Complete delivery after OTP verification. COD settlement can remain pending.
   */
  async completeDelivery(orderId: string, partnerId: string, user: AuthenticatedUser) {
    const order = await this.ensurePartnerOrder(orderId, partnerId);

    if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException('Order must be OUT_FOR_DELIVERY to complete delivery');
    }

    // Prerequisite 1: OTP must be verified
    const otpRecord = await this.prisma.deliveryOtp.findFirst({
      where: { orderId, verifiedAt: { not: null } },
    });
    if (!otpRecord) {
      throw new BadRequestException('Delivery OTP has not been verified by customer');
    }

    const deliveryEarning = 40; // Flat delivery pay per order for MVP

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { orderId } });

      // 1. Update Order -> DELIVERED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
          paymentStatus: payment?.status ?? order.paymentStatus,
        },
      });

      // 2. Check if partner has any remaining active orders before clearing currentOrderId
      const remainingOrders = await tx.order.findMany({
        where: {
          deliveryPartnerId: partnerId,
          id: { not: orderId },
          status: {
            in: [
              OrderStatus.DELIVERY_ASSIGNED,
              OrderStatus.PICKED_UP,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
          },
        },
        select: { id: true },
      });

      const nextOrderId = remainingOrders[0]?.id || null;

      await tx.deliveryPartner.update({
        where: { id: partnerId },
        data: {
          currentOrderId: nextOrderId,
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: deliveryEarning },
        },
      });

      // 3. Record order event
      await tx.orderEvent.create({
        data: {
          orderId,
          actorUserId: user.id,
          eventType: 'ORDER_DELIVERED',
          previousStatus: order.status,
          newStatus: OrderStatus.DELIVERED,
        },
      });

      return updatedOrder;
    });

    // Emit real-time update for order delivered
    try {
      this.realtimeGateway.emitOrderUpdate(orderId, order.restaurantId || '', 'DELIVERED', result);
    } catch {}

    return result;
  }

  // ── Partner Profile & Online Toggle ──

  async getProfile(partnerId: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
    });
    if (!partner) throw new NotFoundException('Delivery partner not found');
    return partner;
  }

  async setOnlineStatus(partnerId: string, status: OnlineStatus) {
    const partner = await this.prisma.deliveryPartner.update({
      where: { id: partnerId },
      data: { onlineStatus: status },
    });

    if (status === OnlineStatus.ONLINE) {
      const readyOrders = await this.prisma.order.findMany({
        where: {
          status: { in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.WAITING_FOR_PARTNER] },
          deliveryPartnerId: null,
        },
        orderBy: { createdAt: 'asc' },
      });

      for (const readyOrder of readyOrders) {
        const pendingOffer = await this.prisma.deliveryRequest.findFirst({
          where: { orderId: readyOrder.id, status: DeliveryRequestStatus.PENDING },
          include: { deliveryPartner: { select: { onlineStatus: true } } },
        });
        if (pendingOffer?.deliveryPartner.onlineStatus === OnlineStatus.ONLINE) continue;

        await this.assignmentService.assignDelivery(readyOrder.id, partnerId);
      }
    }

    return partner;
  }

  async getDeliveries(partnerId: string) {
    return this.prisma.order.findMany({
      where: { deliveryPartnerId: partnerId },
      include: {
        restaurant: { select: { name: true, address: true } },
        customer: { select: { name: true, phone: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingRequests(partnerId: string) {
    return this.prisma.deliveryRequest.findMany({
      where: {
        deliveryPartnerId: partnerId,
        status: DeliveryRequestStatus.PENDING,
        order: {
          is: {
            status: OrderStatus.WAITING_FOR_PARTNER,
            deliveryPartnerId: null,
          },
        },
      },
      include: {
        order: {
          include: {
            restaurant: { select: { name: true, address: true, phone: true } },
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async ensurePartnerOrder(orderId: string, partnerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryPartnerId !== partnerId) {
      throw new ForbiddenException('Order is not assigned to you');
    }
    return order;
  }
}
