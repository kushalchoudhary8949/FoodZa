import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsOptional()
  @IsString()
  supabaseUid?: string;

  @IsOptional()
  @IsString()
  firebaseUid?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEnum(UserRole)
  role: UserRole;

  // Customer-specific
  @IsOptional()
  @IsString()
  hostelOrPgName?: string;

  @IsOptional()
  @IsString()
  roomNumber?: string;
}

export class VerifyTokenDto {
  @IsString()
  token: string;
}

export class SupabaseSyncDto {
  @IsString()
  supabaseUid: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
