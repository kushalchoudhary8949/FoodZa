import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsString()
  firebaseUid: string;

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
