import { IsString, IsNumber, IsPositive } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  otp: string;
}

export class CollectPaymentDto {
  @IsNumber()
  @IsPositive()
  amountCollected: number;
}
