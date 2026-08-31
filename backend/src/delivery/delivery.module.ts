import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { DeliveryAssignmentService } from './delivery-assignment.service';
import { OtpService } from './otp.service';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryAssignmentService, OtpService],
  exports: [DeliveryService, DeliveryAssignmentService, OtpService],
})
export class DeliveryModule {}
