import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto, ValidateOfferDto } from './dto/offers.dto';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOffer(dto: CreateOfferDto) {
    const existing = await this.prisma.offer.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) throw new ConflictException('Offer code already exists');

    return this.prisma.offer.create({
      data: {
        name: dto.name,
        description: dto.description,
        code: dto.code.toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minimumOrderAmount: dto.minimumOrderAmount,
        maximumDiscount: dto.maximumDiscount,
        restaurantId: dto.restaurantId,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
      },
    });
  }

  async findAllAdmin() {
    return this.prisma.offer.findMany({
      include: { restaurant: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAvailableForCustomer(storeId: string) {
    const now = new Date();
    return this.prisma.offer.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
        OR: [{ restaurantId: null }, { restaurantId: storeId }],
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        discountType: true,
        discountValue: true,
        minimumOrderAmount: true,
        maximumDiscount: true,
      },
    });
  }

  async validateOffer(customerId: string, dto: ValidateOfferDto) {
    const offer = await this.prisma.offer.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!offer || !offer.isActive) {
      throw new NotFoundException('Invalid or expired coupon code');
    }

    const now = new Date();
    if (now < offer.startAt || now > offer.endAt) {
      throw new BadRequestException('Coupon code is expired or not active yet');
    }

    if (offer.restaurantId && offer.restaurantId !== dto.restaurantId) {
      throw new BadRequestException('Coupon code is not valid for this restaurant');
    }

    if (offer.minimumOrderAmount && dto.subtotal < Number(offer.minimumOrderAmount)) {
      throw new BadRequestException(`Minimum order amount of ₹${offer.minimumOrderAmount} required`);
    }

    const usage = await this.prisma.offerUsage.findUnique({
      where: { offerId_customerId: { offerId: offer.id, customerId } },
    });
    if (usage) {
      throw new BadRequestException('You have already used this coupon code');
    }

    let discountAmount = 0;
    if (offer.discountType === 'PERCENTAGE') {
      discountAmount = (dto.subtotal * Number(offer.discountValue)) / 100;
      if (offer.maximumDiscount && discountAmount > Number(offer.maximumDiscount)) {
        discountAmount = Number(offer.maximumDiscount);
      }
    } else {
      discountAmount = Number(offer.discountValue);
    }

    return {
      valid: true,
      code: offer.code,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      discountAmount,
    };
  }

  async deactivate(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found');

    return this.prisma.offer.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
