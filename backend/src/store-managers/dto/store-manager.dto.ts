import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateManagerDto {
  @IsString() firebaseUid: string;
  @IsString() name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsString() restaurantId: string;
}

export class UpdateManagerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
}

export class AssignStoreDto {
  @IsString() restaurantId: string;
}
