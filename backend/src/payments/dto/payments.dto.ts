import { IsString, IsOptional } from 'class-validator';

export class RazorpayOrderDto {
  @IsString()
  orderId: string;
}

export class RazorpayWebhookDto {
  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}
