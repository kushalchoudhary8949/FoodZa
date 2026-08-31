import { Controller, Get, Patch, Post, Delete, Param, Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CustomersService } from './customers.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { UpdateCustomerDto, CreateAddressDto, UpdateAddressDto } from './dto/customer.dto';

@Controller('customers')
@Roles(UserRole.CUSTOMER)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.getProfile(user.customerId!);
  }

  @Patch('profile')
  async updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCustomerDto) {
    return this.customersService.updateProfile(user.customerId!, dto);
  }

  @Get('addresses')
  async getAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.getAddresses(user.customerId!);
  }

  @Post('addresses')
  async createAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAddressDto) {
    return this.customersService.createAddress(user.customerId!, dto);
  }

  @Patch('addresses/:id')
  async updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.customersService.updateAddress(user.customerId!, id, dto);
  }

  @Delete('addresses/:id')
  async deleteAddress(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customersService.deleteAddress(user.customerId!, id);
  }
}
