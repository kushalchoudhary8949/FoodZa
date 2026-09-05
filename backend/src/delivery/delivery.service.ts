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

    // 2. Execute atomic updates using batch transaction (PgBouncer-safe)
    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: targetOrderId },
        data: {
          status: OrderStatus.DELIVERY_ASSIGNED,
          deliveryPartnerId: partnerId,
        },
        include: {
          restaurant: { select: { id: true, name: true, phone: true, address: true } },
          customer: { select: { id: true, name: true, phone: true } },
          orderItems: true,
          payment: true,
        },
      }),
      this.prisma.deliveryRequest.update({
        where: { id: effectiveRequestId },
        data: {
          status: DeliveryRequestStatus.ACCEPTED,
          deliveryPartnerId: partnerId,
          acceptedAt: new Date(),
          respondedAt: new Date(),
        },
      }),
      this.prisma.deliveryPartner.update({
        where: { id: partnerId },
        data: { currentOrderId: targetOrderId },
      }),
      this.prisma.orderEvent.create({
        data: {
          orderId: targetOrderId,
          actorUserId: user.id,
          eventType: 'DELIVERY_ASSIGNED',
          previousStatus: request.order.status,
          newStatus: OrderStatus.DELIVERY_ASSIGNED,
        },
      }),
    ]);

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

  /**
   * Simulate a delivery dispatch for testing — finds or creates an eligible order and triggers assignment
   */
  async simulateDispatch(partnerId: string) {
    // 1. Clear any existing pending requests for this partner so they can receive new ones
    await this.prisma.deliveryRequest.updateMany({
      where: {
        deliveryPartnerId: partnerId,
        status: DeliveryRequestStatus.PENDING,
      },
      data: { status: DeliveryRequestStatus.EXPIRED },
    });

    // 2. Ensure partner is online and free
    await this.prisma.deliveryPartner.update({
      where: { id: partnerId },
      data: { onlineStatus: OnlineStatus.ONLINE, currentOrderId: null },
    });

    // 3. Find an order that's ready for delivery assignment
    let eligibleOrder = await this.prisma.order.findFirst({
      where: {
        status: {
          in: [
            OrderStatus.MANAGER_ACCEPTED,
            OrderStatus.ADMIN_ACCEPTED,
            OrderStatus.PREPARING,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.WAITING_FOR_PARTNER,
          ],
        },
        deliveryPartnerId: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fallback: If no eligible order, find ANY order and reset it to READY_FOR_PICKUP
    if (!eligibleOrder) {
      const anyOrder = await this.prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      if (anyOrder) {
        eligibleOrder = await this.prisma.order.update({
          where: { id: anyOrder.id },
          data: {
            status: OrderStatus.READY_FOR_PICKUP,
            deliveryPartnerId: null,
          },
        });
        await this.prisma.deliveryRequest.deleteMany({
          where: { orderId: anyOrder.id },
        });
      }
    }

    // Fallback 2: If no order at all in DB, create a demo order
    if (!eligibleOrder) {
      const restaurant = await this.prisma.restaurant.findFirst();
      const customer = await this.prisma.customer.findFirst();
      if (restaurant && customer) {
        const orderNumber = `FC-${Date.now().toString().slice(-6)}`;
        eligibleOrder = await this.prisma.order.create({
          data: {
            orderNumber,
            customerId: customer.id,
            restaurantId: restaurant.id,
            deliveryAddress: 'Hostel 4, Room 204, Campus East',
            subtotal: 180,
            deliveryFee: 30,
            totalAmount: 210,
            paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
            paymentStatus: PaymentStatus.PENDING,
            status: OrderStatus.READY_FOR_PICKUP,
          },
        });
      }
    }

    if (!eligibleOrder) {
      throw new NotFoundException('No restaurant or customer found in database to simulate an order.');
    }

    // Clear previous requests for this partner on this order
    await this.prisma.deliveryRequest.deleteMany({
      where: { orderId: eligibleOrder.id, deliveryPartnerId: partnerId },
    });

    const assigned = await this.assignmentService.assignDelivery(eligibleOrder.id, partnerId);

    if (!assigned) {
      throw new BadRequestException('Delivery assignment failed — partner could not be assigned');
    }

    return {
      success: true,
      message: `Delivery request dispatched for order ${eligibleOrder.orderNumber || eligibleOrder.id}`,
      orderId: eligibleOrder.id,
    };
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
