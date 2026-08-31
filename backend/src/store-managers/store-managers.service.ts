import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManagerDto, UpdateManagerDto, AssignStoreDto } from './dto/store-manager.dto';

@Injectable()
export class StoreManagersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.manager.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
        restaurant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const manager = await this.prisma.manager.findUnique({
      where: { id },
      include: {
        user: true,
        restaurant: true,
      },
    });
    if (!manager) throw new NotFoundException('Manager not found');
    return manager;
  }

  async create(dto: CreateManagerDto) {
    // Check if the firebase UID already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { firebaseUid: dto.firebaseUid },
    });
    if (existingUser) throw new ConflictException('User already exists with this Firebase UID');

    // Verify restaurant exists
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firebaseUid: dto.firebaseUid,
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          role: UserRole.MANAGER,
        },
      });

      const manager = await tx.manager.create({
        data: {
          userId: user.id,
          restaurantId: dto.restaurantId,
        },
      });

      return { ...manager, user };
    });
  }

  async update(id: string, dto: UpdateManagerDto) {
    const manager = await this.findById(id);
    return this.prisma.user.update({
      where: { id: manager.userId },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
      },
    });
  }

  async assignStore(id: string, dto: AssignStoreDto) {
    await this.findById(id);
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.manager.update({
      where: { id },
      data: { restaurantId: dto.restaurantId },
      include: { restaurant: true },
    });
  }

  async activate(id: string) {
    const manager = await this.findById(id);
    return this.prisma.$transaction([
      this.prisma.user.update({ where: { id: manager.userId }, data: { isActive: true } }),
      this.prisma.manager.update({ where: { id }, data: { isActive: true } }),
    ]);
  }

  async deactivate(id: string) {
    const manager = await this.findById(id);
    return this.prisma.$transaction([
      this.prisma.user.update({ where: { id: manager.userId }, data: { isActive: false } }),
      this.prisma.manager.update({ where: { id }, data: { isActive: false } }),
    ]);
  }
}
