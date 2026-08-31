import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCustomerDto, CreateAddressDto, UpdateAddressDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { addresses: { orderBy: { isDefault: 'desc' } } },
    });
    if (!customer) throw new NotFoundException('Customer profile not found');
    return customer;
  }

  async updateProfile(customerId: string, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id: customerId },
      data: dto,
    });
  }

  // ── Addresses ──

  async getAddresses(customerId: string) {
    return this.prisma.address.findMany({
      where: { customerId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async createAddress(customerId: string, dto: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      // If this is set as default, unset other defaults
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { customerId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: { customerId, ...dto },
      });
    });
  }

  async updateAddress(customerId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.customerId !== customerId) throw new ForbiddenException('Not your address');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { customerId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id: addressId },
        data: dto,
      });
    });
  }

  async deleteAddress(customerId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.customerId !== customerId) throw new ForbiddenException('Not your address');

    return this.prisma.address.delete({ where: { id: addressId } });
  }
}
