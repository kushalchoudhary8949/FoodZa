import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { DeliveryAssignmentService } from '../delivery/delivery-assignment.service';
import { CreateOrderDto, ManagerActionDto, AdminActionDto } from './dto/order.dto';
import { isValidTransition } from './order-state-machine';
import { ORDER_TIMEOUT_QUEUE, MANAGER_TIMEOUT_JOB } from './order-timeout.processor';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly deliveryAssignment: DeliveryAssignmentService,
    @InjectQueue(ORDER_TIMEOUT_QUEUE) private readonly timeoutQueue: Queue,
  ) {}

  /**
   * Place a new order
   */
  async createOrder(customerIdInput: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Cart cannot be empty');
    }

    // Resolve valid customer ID
    let customerId = customerIdInput;
    let customer = await this.prisma.customer.findUnique({ where: { id: customerIdInput } });

    if (!customer) {
      customer = await this.prisma.customer.findFirst({ where: { userId: customerIdInput } });
      if (!customer) {
        const user = await this.prisma.user.findFirst({
          where: { OR: [{ id: customerIdInput }, { firebaseUid: customerIdInput }] },
        });
        customer = await this.prisma.customer.create({
          data: {
            userId: user?.id || customerIdInput,
            name: user?.name || 'Customer',
            phone: user?.phone || '+91 98000 00000',
          },
        });
      }
      customerId = customer.id;
    }

    // 1. Verify restaurant exists and is active/open
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant || !restaurant.isActive) {
      throw new NotFoundException('Restaurant not found or inactive');
    }

    // 2. Resolve delivery address
    let deliveryAddressStr = dto.deliveryAddress || '';
    let hostelOrPgName = dto.hostelOrPgName;
    let roomNumber = dto.roomNumber;

    if (dto.addressId) {
      const addr = await this.prisma.address.findUnique({ where: { id: dto.addressId } });
      if (!addr || addr.customerId !== customerId) {
        throw new BadRequestException('Invalid address selection');
      }
      deliveryAddressStr = addr.addressLine;
      hostelOrPgName = hostelOrPgName || addr.hostelOrPgName || undefined;
      roomNumber = roomNumber || addr.roomNumber || undefined;
    }

    if (!deliveryAddressStr) {
      throw new BadRequestException('Delivery address is required');
    }

    // 3. Fetch menu items to compute server-side prices
    const itemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: itemIds },
        restaurantId: dto.restaurantId,
        isActive: true,
        isAvailable: true,
      },
    });

    if (menuItems.length !== itemIds.length) {
      throw new BadRequestException('Some menu items are invalid or unavailable');
    }

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

    // Compute subtotal
    let subtotal = 0;
    const orderItemsData = dto.items.map((item) => {
      const target = menuItemMap.get(item.menuItemId)!;
      const unitPrice = Number(target.price);
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      return {
        menuItemId: target.id,
        itemNameSnapshot: target.name,
        unitPrice: unitPrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
      };
    });

    const deliveryFee = 30; // Flat standard fee for MVP or configurable
    let discountAmount = 0;
    let appliedOfferId: string | null = null;

    // 4. Offer code validation if provided
    if (dto.offerCode) {
      const offer = await this.prisma.offer.findUnique({
        where: { code: dto.offerCode },
      });

      if (
        offer &&
        offer.isActive &&
        new Date() >= offer.startAt &&
        new Date() <= offer.endAt
      ) {
        if (!offer.restaurantId || offer.restaurantId === dto.restaurantId) {
          if (!offer.minimumOrderAmount || subtotal >= Number(offer.minimumOrderAmount)) {
            // Check if customer already used offer
            const usage = await this.prisma.offerUsage.findUnique({
              where: {
                offerId_customerId: { offerId: offer.id, customerId },
              },
            });

            if (!usage) {
              if (offer.discountType === 'PERCENTAGE') {
                discountAmount = (subtotal * Number(offer.discountValue)) / 100;
                if (offer.maximumDiscount && discountAmount > Number(offer.maximumDiscount)) {
                  discountAmount = Number(offer.maximumDiscount);
                }
              } else {
                discountAmount = Number(offer.discountValue);
              }
              appliedOfferId = offer.id;
            }
          }
        }
      }
    }

    const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

    // Generate Order Number: FC-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `FC-${dateStr}-${randomSuffix}`;

    const timeoutSeconds = this.config.get<number>('MANAGER_TIMEOUT_SECONDS', 60);
    const deadline = new Date(Date.now() + timeoutSeconds * 1000);

    // 5. Execute creation directly (Prisma nested create is inherently atomic in a single transaction)
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        restaurantId: dto.restaurantId,
        addressId: dto.addressId,
        deliveryAddress: deliveryAddressStr,
        hostelOrPgName,
        roomNumber,
        subtotal,
        deliveryFee,
        discountAmount,
        totalAmount,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        status: OrderStatus.WAITING_FOR_MANAGER,
        managerResponseDeadline: deadline,
        orderItems: {
          create: orderItemsData,
        },
        payment: {
          create: {
            method: dto.paymentMethod,
            status: PaymentStatus.PENDING,
            amount: totalAmount,
          },
        },
        orderEvents: {
          create: {
            eventType: 'ORDER_CREATED',
            newStatus: OrderStatus.WAITING_FOR_MANAGER,
            metadata: { createdByCustomer: customerId },
          },
        },
      },
      include: {
        orderItems: true,
        restaurant: { select: { name: true, phone: true } },
        customer: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    if (appliedOfferId) {
      try {
        await this.prisma.offerUsage.create({
          data: {
            offerId: appliedOfferId,
            customerId,
            orderId: order.id,
            discountAmount,
          },
        });
      } catch (offerErr: any) {
        this.logger.warn(`Could not record offer usage for order ${order.id}: ${offerErr.message}`);
      }
    }

    // 6. Schedule BullMQ Manager Timeout Job
    try {
      await this.timeoutQueue.add(
        MANAGER_TIMEOUT_JOB,
        { orderId: order.id },
        {
          delay: timeoutSeconds * 1000,
          jobId: `order-timeout-${order.id}`,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      this.logger.log(`Order ${order.id} (${order.orderNumber}) created. Timeout scheduled in ${timeoutSeconds}s.`);
    } catch (queueErr: any) {
      this.logger.warn(`Could not schedule BullMQ timeout job for order ${order.id}: ${queueErr.message}`);
    }

    // Emit Socket.IO events: new order to store manager + order update to admin
    try {
      this.realtimeGateway.emitNewOrderToStore(order.restaurantId, order);
      this.realtimeGateway.emitOrderUpdate(order.id, order.restaurantId, order.status, order);
    } catch (socketErr: any) {
      this.logger.warn(`Socket.IO emit failed for new order ${order.id}: ${socketErr.message}`);
    }

    return order;
  }

  /**
   * Manager accepts an order
   */
  async managerAccept(orderId: string, managerRestaurantId: string, user: AuthenticatedUser, dto?: ManagerActionDto) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.restaurantId !== managerRestaurantId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only manage orders for your assigned restaurant');
    }

    // Treat retries from a double-click or a stale panel as successful no-ops.
    if (order.status === OrderStatus.MANAGER_ACCEPTED) {
      return order;
    }

    this.validateStatusTransition(order.status, OrderStatus.MANAGER_ACCEPTED);

    // Cancel timeout job
    await this.cancelTimeoutJob(orderId);

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.MANAGER_ACCEPTED,
          acceptedAt: new Date(),
        },
      }),
      this.prisma.orderEvent.create({
        data: {
          orderId,
          actorUserId: user.id,
          eventType: 'MANAGER_ACCEPTED',
          previousStatus: order.status,
          newStatus: OrderStatus.MANAGER_ACCEPTED,
          metadata: dto?.reason ? { reason: dto.reason } : undefined,
        },
      }),
    ]);

    // Emit real-time update to all rooms (informational notification to admin)
    this.realtimeGateway.emitOrderUpdate(orderId, order.restaurantId, 'MANAGER_ACCEPTED', updated);

    return updated;
  }

  /**
   * Manager rejects an order
   */
  async managerReject(orderId: string, managerRestaurantId: string, user: AuthenticatedUser, dto?: ManagerActionDto) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.restaurantId !== managerRestaurantId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only manage orders for your assigned restaurant');
    }

    this.validateStatusTransition(order.status, OrderStatus.MANAGER_REJECTED);

    // Cancel timeout job
    await this.cancelTimeoutJob(orderId);

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.MANAGER_REJECTED,
          rejectedAt: new Date(),
        },
      }),
      this.prisma.orderEvent.create({
        data: {
          orderId,
          actorUserId: user.id,
          eventType: 'MANAGER_REJECTED',
          previousStatus: order.status,
          newStatus: OrderStatus.MANAGER_REJECTED,
          metadata: dto?.reason ? { reason: dto.reason } : undefined,
        },
      }),
    ]);

    // Emit real-time update (informational notification to admin, rejection to customer)
    this.realtimeGateway.emitOrderUpdate(orderId, order.restaurantId, 'MANAGER_REJECTED', updated);

    return updated;
  }

  /**
   * Admin accepts timed-out order
   */
  async adminAccept(orderId: string, user: AuthenticatedUser, dto?: AdminActionDto) {
    const order = await this.getOrderOrThrow(orderId);

    this.validateStatusTransition(order.status, OrderStatus.ADMIN_ACCEPTED);

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.ADMIN_ACCEPTED,
          acceptedAt: new Date(),
        },
      }),
      this.prisma.orderEvent.create({
        data: {
          orderId,
          actorUserId: user.id,
          eventType: 'ADMIN_ACCEPTED',
          previousStatus: order.status,
          newStatus: OrderStatus.ADMIN_ACCEPTED,
          metadata: dto?.reason ? { reason: dto.reason } : undefined,
        },
      }),
    ]);

    // Emit real-time update
    this.realtimeGateway.emitOrderUpdate(orderId, order.restaurantId, 'ADMIN_ACCEPTED', updated);

    // Admin accepted a timed-out order → auto-transition to PREPARING and trigger delivery assignment
    try {
      await this.deliveryAssignment.assignDelivery(orderId);
    } catch (assignErr: any) {
      this.logger.warn(`Delivery assignment after admin accept failed for ${orderId}: ${assignErr.message}`);
    }

    return updated;
  }

  /**
   * Admin rejects timed-out order
   */
  async adminReject(orderId: string, user: AuthenticatedUser, dto?: AdminActionDto) {
    const order = await this.getOrderOrThrow(orderId);

    this.validateStatusTransition(order.status, OrderStatus.ADMIN_REJECTED);

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.ADMIN_REJECTED,
          rejectedAt: new Date(),
        },
      }),
      this.prisma.orderEvent.create({
        data: {
          orderId,
          actorUserId: user.id,
          eventType: 'ADMIN_REJECTED',
          previousStatus: order.status,
          newStatus: OrderStatus.ADMIN_REJECTED,
          metadata: dto?.reason ? { reason: dto.reason } : undefined,
        },
      }),
    ]);

    // Emit real-time update (customer notified of rejection)
    this.realtimeGateway.emitOrderUpdate(orderId, order.restaurantId, 'ADMIN_REJECTED', updated);

    return updated;
  }

  /**
   * Mark order as PREPARING
   */
  async markPreparing(orderId: string, user: AuthenticatedUser) {
    const order = await this.getOrderOrThrow(orderId);
    if (user.role === UserRole.MANAGER && order.restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Not your store order');
    }

    this.validateStatusTransition(order.status, OrderStatus.PREPARING);

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PREPARING,
        },
      }),
      this.prisma.orderEvent.create({
        data: {
          orderId,
          actorUserId: user.id,
          eventType: 'ORDER_PREPARING',
          previousStatus: order.status,
          newStatus: OrderStatus.PREPARING,
        },
      }),
    ]);

    this.realtimeGateway.emitOrderUpdate(orderId, order.restaurantId, 'PREPARING', updated);

    return updated;
  }

  /**
   * Mark order as READY_FOR_PICKUP
   */
  async markReady(orderId: string, user: AuthenticatedUser) {
    const order = await this.getOrderOrThrow(orderId);
    if (user.role === UserRole.MANAGER && order.restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Not your store order');
    }

    this.validateStatusTransition(order.status, OrderStatus.READY_FOR_PICKUP);

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.READY_FOR_PICKUP,
          preparedAt: new Date(),
        },
      }),
      this.prisma.orderEvent.create({
        data: {
          orderId,
          actorUserId: user.id,
          eventType: 'READY_FOR_PICKUP',
          previousStatus: order.status,
          newStatus: OrderStatus.READY_FOR_PICKUP,
        },
      }),
    ]);

    this.realtimeGateway.emitOrderUpdate(orderId, order.restaurantId, 'READY_FOR_PICKUP', updated);

    // Auto-trigger delivery partner assignment when food is ready
    try {
      await this.deliveryAssignment.assignDelivery(orderId);
    } catch (assignErr: any) {
      this.logger.warn(`Delivery assignment failed for ${orderId}: ${assignErr.message}`);
    }

    return updated;
  }

  // ── Queries ──

  async findById(id: string, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        restaurant: { select: { id: true, name: true, phone: true, address: true } },
        customer: { select: { id: true, name: true, phone: true } },
        deliveryPartner: { select: { id: true, phone: true, user: { select: { name: true } } } },
        payment: true,
        orderEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Scoped access check
    if (user.role === UserRole.CUSTOMER && order.customerId !== user.customerId) {
      throw new ForbiddenException('Access denied');
    }
    if (user.role === UserRole.MANAGER && order.restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Access denied');
    }
    if (user.role === UserRole.DELIVERY_PARTNER && order.deliveryPartnerId !== user.deliveryPartnerId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async findCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        orderItems: true,
        restaurant: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStoreOrders(restaurantId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: {
        restaurantId,
        status: status ? status : undefined,
      },
      include: {
        orderItems: true,
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin(query: { status?: OrderStatus; storeId?: string; customerId?: string }) {
    return this.prisma.order.findMany({
      where: {
        status: query.status,
        restaurantId: query.storeId,
        customerId: query.customerId,
      },
      include: {
        restaurant: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
        deliveryPartner: { select: { user: { select: { name: true } } } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOrderOrThrow(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private validateStatusTransition(current: OrderStatus, next: OrderStatus) {
    if (!isValidTransition(current, next)) {
      throw new BadRequestException(`Cannot transition order status from ${current} to ${next}`);
    }
  }

  private async cancelTimeoutJob(orderId: string) {
    try {
      const jobId = `order-timeout-${orderId}`;
      const job = await this.timeoutQueue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`Cancelled timeout job for order ${orderId}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to cancel timeout job for order ${orderId}: ${(err as Error).message}`);
    }
  }
}
