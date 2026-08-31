import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() hostelOrPgName?: string;
  @IsOptional() @IsString() roomNumber?: string;
}

export class CreateAddressDto {
  @IsOptional() @IsString() label?: string;
  @IsString() addressLine: string;
  @IsOptional() @IsString() hostelOrPgName?: string;
  @IsOptional() @IsString() roomNumber?: string;
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() addressLine?: string;
  @IsOptional() @IsString() hostelOrPgName?: string;
  @IsOptional() @IsString() roomNumber?: string;
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
