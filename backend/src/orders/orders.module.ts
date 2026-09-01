import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderTimeoutProcessor, ORDER_TIMEOUT_QUEUE } from './order-timeout.processor';
import { DeliveryAssignmentService } from '../delivery/delivery-assignment.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ORDER_TIMEOUT_QUEUE,
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderTimeoutProcessor, DeliveryAssignmentService],
  exports: [OrdersService],
})
export class OrdersModule {}
