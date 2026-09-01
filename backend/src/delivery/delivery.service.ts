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
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Fetch request with pessimistic check
      const request = await tx.deliveryRequest.findUnique({
        where: { id: requestId },
        include: { order: true },
      });

      if (!request || request.deliveryPartnerId !== partnerId) {
        throw new NotFoundException('Delivery request not found or not assigned to you');
      }

      if (request.status !== DeliveryRequestStatus.PENDING) {
        throw new ConflictException('Delivery request has already been processed or expired');
      }

      if (new Date() > request.expiresAt) {
        await tx.deliveryRequest.update({
          where: { id: requestId },
          data: { status: DeliveryRequestStatus.EXPIRED },
        });
        throw new ConflictException('Delivery request expired');
      }

      // Check if order is already assigned to someone else
      if (request.order.status !== OrderStatus.WAITING_FOR_PARTNER && request.order.deliveryPartnerId) {
        throw new ConflictException('Order has already been accepted by another partner');
      }

      // 2. Mark request as ACCEPTED
      await tx.deliveryRequest.update({
        where: { id: requestId },
        data: {
          status: DeliveryRequestStatus.ACCEPTED,
          acceptedAt: new Date(),
          respondedAt: new Date(),
        },
      });

      // 3. Cancel any other pending requests for this order
      await tx.deliveryRequest.updateMany({
        where: { orderId: request.orderId, id: { not: requestId }, status: DeliveryRequestStatus.PENDING },
        data: { status: DeliveryRequestStatus.CANCELLED },
      });

      // 4. Update Order status
      const updatedOrder = await tx.order.update({
        where: { id: request.orderId },
        data: {
          status: OrderStatus.DELIVERY_ASSIGNED,
          deliveryPartnerId: partnerId,
        },
      });

      // 5. Set partner currentOrderId
      await tx.deliveryPartner.update({
        where: { id: partnerId },
        data: { currentOrderId: request.orderId },
      });

      // 6. Record event
      await tx.orderEvent.create({
        data: {
          orderId: request.orderId,
          actorUserId: user.id,
          eventType: 'DELIVERY_ASSIGNED',
          previousStatus: request.order.status,
          newStatus: OrderStatus.DELIVERY_ASSIGNED,
        },
      });

      // 7. Generate Delivery OTP for Customer
      const rawOtp = await this.otpService.generateOtp(request.orderId);

      this.logger.log(`Partner ${partnerId} accepted order ${request.orderId}. Generated OTP for customer.`);

      return { order: updatedOrder, otp: rawOtp };
    });

    // Emit real-time update for delivery assigned
    try {
      const order = result.order;
      this.realtimeGateway.emitOrderUpdate(requestId.includes('-') ? order.id : requestId, order.restaurantId || '', 'DELIVERY_ASSIGNED', order);
    } catch {}

    return result;
  }

  /**
   * Delivery Partner rejects a delivery request
   */
  async rejectRequest(requestId: string, partnerId: string, user: AuthenticatedUser) {
    const request = await this.prisma.deliveryRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.deliveryPartnerId !== partnerId) {
      throw new NotFoundException('Delivery request not found');
    }

    if (request.status !== DeliveryRequestStatus.PENDING) {
      throw new BadRequestException('Request is no longer pending');
    }

    await this.prisma.deliveryRequest.update({
      where: { id: requestId },
      data: {
        status: DeliveryRequestStatus.REJECTED,
        rejectedAt: new Date(),
        respondedAt: new Date(),
      },
    });

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
   * Complete delivery (Enforces OTP + Payment prerequisites!)
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

    // Prerequisite 2: Payment must be PAID
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment || payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Payment has not been completed/collected');
    }

    const deliveryEarning = 40; // Flat delivery pay per order for MVP

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update Order -> DELIVERED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
          paymentStatus: PaymentStatus.PAID,
        },
      });

      // 2. Free up Partner & add earnings
      await tx.deliveryPartner.update({
        where: { id: partnerId },
        data: {
          currentOrderId: null,
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
    return this.prisma.deliveryPartner.update({
      where: { id: partnerId },
      data: { onlineStatus: status },
    });
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
        expiresAt: { gt: new Date() },
      },
      include: {
        order: {
          include: {
            restaurant: { select: { name: true, address: true, phone: true } },
            orderItems: true,
          },
        },
      },
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
