import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDeliveryPartnerDto {
  @IsString() firebaseUid: string;
  @IsString() name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
}

export class UpdateDeliveryPartnerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
}
