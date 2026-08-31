import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Generate and store a new OTP for an order
   */
  async generateOtp(orderId: string): Promise<string> {
    // Generate 4-digit numeric OTP
    const rawOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    const expiryMinutes = this.config.get<number>('OTP_EXPIRY_MINUTES', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await this.prisma.deliveryOtp.create({
      data: {
        orderId,
        hashedOtp,
        expiresAt,
      },
    });

    this.logger.log(`Generated OTP for order ${orderId}`);
    return rawOtp;
  }

  /**
   * Verify an OTP submitted by a delivery partner
   */
  async verifyOtp(orderId: string, inputOtp: string): Promise<boolean> {
    const otpRecord = await this.prisma.deliveryOtp.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No OTP found for this order');
    }

    if (otpRecord.verifiedAt) {
      return true; // Already verified
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    const maxAttempts = this.config.get<number>('OTP_MAX_ATTEMPTS', 5);
    if (otpRecord.attempts >= maxAttempts) {
      throw new BadRequestException('Maximum OTP verification attempts exceeded');
    }

    // Increment attempt count
    await this.prisma.deliveryOtp.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    const isMatch = await bcrypt.compare(inputOtp, otpRecord.hashedOtp);
    if (!isMatch) {
      throw new BadRequestException('Invalid OTP code');
    }

    // Mark verified
    await this.prisma.deliveryOtp.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    });

    return true;
  }
}
