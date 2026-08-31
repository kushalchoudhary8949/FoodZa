import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { firebaseUid: dto.firebaseUid },
    });
    if (existing) {
      throw new ConflictException('User already registered');
    }

    // Create user + role-specific profile in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firebaseUid: dto.firebaseUid,
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          role: dto.role,
        },
      });

      // Create role-specific profile
      switch (dto.role) {
        case UserRole.CUSTOMER:
          await tx.customer.create({
            data: {
              userId: user.id,
              name: dto.name,
              phone: dto.phone,
              hostelOrPgName: dto.hostelOrPgName,
              roomNumber: dto.roomNumber,
            },
          });
          break;

        case UserRole.DELIVERY_PARTNER:
          await tx.deliveryPartner.create({
            data: {
              userId: user.id,
              phone: dto.phone,
            },
          });
          break;

        // MANAGER and ADMIN profiles are created by admin endpoints
        default:
          break;
      }

      this.logger.log(`User registered: ${user.id} (${user.role})`);

      return this.getUserProfile(user.firebaseUid);
    });
  }

  async getUserProfile(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        customer: true,
        manager: { include: { restaurant: { select: { id: true, name: true, slug: true } } } },
        deliveryPartner: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
