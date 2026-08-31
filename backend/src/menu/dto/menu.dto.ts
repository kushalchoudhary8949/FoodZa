import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsInt, Min } from 'class-validator';
import { FoodType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateMenuItemDto {
  @IsString() categoryId: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsNumber() price: number;
  @IsEnum(FoodType) foodType: FoodType;
}

export class UpdateMenuItemDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsEnum(FoodType) foodType?: FoodType;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
}

export class UpdateAvailabilityDto {
  @IsBoolean() isAvailable: boolean;
}
