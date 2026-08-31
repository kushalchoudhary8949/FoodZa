import { IsString, IsArray, ValidateNested, IsInt, Min, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class OrderItemInputDto {
  @IsString()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  restaurantId: string;

  @IsOptional()
  @IsString()
  addressId?: string;

  // Custom address if addressId is not provided
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  hostelOrPgName?: string;

  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  offerCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}

export class ManagerActionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdminActionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
