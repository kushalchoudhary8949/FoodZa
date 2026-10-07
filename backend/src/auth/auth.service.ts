import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, SupabaseSyncDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    if (!dto.supabaseUid && !dto.firebaseUid) {
      throw new BadRequestException('Either supabaseUid or firebaseUid must be provided');
    }

    // Check if user already exists
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.supabaseUid ? [{ supabaseUid: dto.supabaseUid }] : []),
          ...(dto.firebaseUid ? [{ firebaseUid: dto.firebaseUid }] : []),
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existing) {
      // If user exists by email and now provides supabaseUid, link it
      if (dto.supabaseUid && !existing.supabaseUid) {
        const updated = await this.prisma.user.update({
          where: { id: existing.id },
          data: { supabaseUid: dto.supabaseUid },
        });
        return this.getUserProfile(updated.id);
      }
      throw new ConflictException('User already registered');
    }

    // Create user + role-specific profile in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          supabaseUid: dto.supabaseUid,
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

      this.logger.log(`User registered: ${user.id} (${user.role}) [supabase: ${user.supabaseUid ?? 'none'}, firebase: ${user.firebaseUid ?? 'none'}]`);

      return this.getUserProfile(user.id);
    });
  }

  async syncSupabaseUser(dto: SupabaseSyncDto) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { supabaseUid: dto.supabaseUid },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    const targetRole = dto.role ?? UserRole.CUSTOMER;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          supabaseUid: dto.supabaseUid,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          role: targetRole,
          customer: targetRole === UserRole.CUSTOMER ? {
            create: {
              name: dto.name,
              phone: dto.phone,
            },
          } : undefined,
        },
      });
      this.logger.log(`Auto-synced new Supabase user: ${user.id} (${user.email})`);
    } else if (!user.supabaseUid) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { supabaseUid: dto.supabaseUid },
      });
      this.logger.log(`Linked existing user ${user.id} to Supabase UID ${dto.supabaseUid}`);
    }

    return this.getUserProfile(user.id);
  }

  async getUserProfile(idOrUid: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: idOrUid },
          { supabaseUid: idOrUid },
          { firebaseUid: idOrUid },
          { email: idOrUid },
        ],
      },
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
