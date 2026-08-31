import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

export const ORDER_TIMEOUT_QUEUE = 'order-timeout';
export const MANAGER_TIMEOUT_JOB = 'manager-timeout';

@Processor(ORDER_TIMEOUT_QUEUE)
export class OrderTimeoutProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderTimeoutProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ orderId: string }>): Promise<void> {
    const { orderId } = job.data;
    this.logger.log(`Processing timeout check for order ${orderId}`);

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found during timeout check`);
        return;
      }

      // If still WAITING_FOR_MANAGER, transition to MANAGER_TIMEOUT and then WAITING_FOR_ADMIN
      if (order.status === OrderStatus.WAITING_FOR_MANAGER) {
        this.logger.log(`Order ${orderId} timed out by manager! Transitioning to WAITING_FOR_ADMIN.`);

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.WAITING_FOR_ADMIN,
          },
        });

        // Record order event
        await tx.orderEvent.create({
          data: {
            orderId,
            eventType: 'MANAGER_TIMEOUT',
            previousStatus: OrderStatus.WAITING_FOR_MANAGER,
            newStatus: OrderStatus.WAITING_FOR_ADMIN,
            metadata: { note: 'Manager failed to respond within deadline' },
          },
        });

        // Create Admin notification
        // Note: Realtime gateway will also emit events if connected
      } else {
        this.logger.log(`Order ${orderId} status is ${order.status}, timeout ignored.`);
      }
    });
  }
}
