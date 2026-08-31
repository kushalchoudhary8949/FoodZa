import { Controller, Get, Post, Param, Body, Query, Delete } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OffersService } from './offers.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateOfferDto, ValidateOfferDto } from './dto/offers.dto';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async createOffer(@Body() dto: CreateOfferDto) {
    return this.offersService.createOffer(dto);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async findAllAdmin() {
    return this.offersService.findAllAdmin();
  }

  @Get('available')
  @Roles(UserRole.CUSTOMER)
  async findAvailable(@Query('storeId') storeId: string) {
    return this.offersService.findAvailableForCustomer(storeId);
  }

  @Post('validate')
  @Roles(UserRole.CUSTOMER)
  async validateOffer(@CurrentUser() user: AuthenticatedUser, @Body() dto: ValidateOfferDto) {
    return this.offersService.validateOffer(user.customerId!, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.offersService.deactivate(id);
  }
}
