import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsBoolean, Min } from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreateOfferDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  code: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscount?: number;

  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}

export class ValidateOfferDto {
  @IsString()
  code: string;

  @IsString()
  restaurantId: string;

  @IsNumber()
  @Min(0)
  subtotal: number;
}
