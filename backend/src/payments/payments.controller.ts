import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RazorpayOrderDto, RazorpayWebhookDto } from './dto/payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('order/:orderId')
  async getPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentByOrder(orderId);
  }

  @Post('razorpay/create-order')
  async createRazorpayOrder(@Body() dto: RazorpayOrderDto) {
    return this.paymentsService.createRazorpayOrder(dto.orderId);
  }

  @Post('razorpay/verify')
  async verifyPayment(@Body() dto: RazorpayWebhookDto) {
    return this.paymentsService.verifyRazorpayPayment(dto.razorpayOrderId, dto.razorpayPaymentId);
  }
}
