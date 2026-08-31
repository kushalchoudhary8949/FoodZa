import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
