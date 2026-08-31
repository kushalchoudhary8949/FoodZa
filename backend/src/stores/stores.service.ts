import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = true) {
    return this.prisma.restaurant.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const store = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuCategories: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        managers: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
      },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async create(dto: CreateStoreDto) {
    const existing = await this.prisma.restaurant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Store slug already exists');

    return this.prisma.restaurant.create({ data: dto });
  }

  async update(id: string, dto: UpdateStoreDto) {
    await this.ensureExists(id);
    return this.prisma.restaurant.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    return this.prisma.restaurant.update({ where: { id }, data: { isActive: false } });
  }

  async activate(id: string) {
    await this.ensureExists(id);
    return this.prisma.restaurant.update({ where: { id }, data: { isActive: true } });
  }

  async toggleOpen(id: string) {
    const store = await this.ensureExists(id);
    return this.prisma.restaurant.update({
      where: { id },
      data: { isOpen: !store.isOpen },
    });
  }

  private async ensureExists(id: string) {
    const store = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }
}
