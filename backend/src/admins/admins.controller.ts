import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminsService } from './admins.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateDeliveryPartnerDto, UpdateDeliveryPartnerDto } from './dto/admins.dto';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminsService.getDashboardMetrics();
  }

  @Get('delivery-partners')
  async getPartners() {
    return this.adminsService.findAllPartners();
  }

  @Post('delivery-partners')
  async createPartner(@Body() dto: CreateDeliveryPartnerDto) {
    return this.adminsService.createPartner(dto);
  }

  @Patch('delivery-partners/:id')
  async updatePartner(@Param('id') id: string, @Body() dto: UpdateDeliveryPartnerDto) {
    return this.adminsService.updatePartner(id, dto);
  }

  @Post('delivery-partners/:id/activate')
  async activatePartner(@Param('id') id: string) {
    return this.adminsService.activatePartner(id);
  }

  @Post('delivery-partners/:id/deactivate')
  async deactivatePartner(@Param('id') id: string) {
    return this.adminsService.deactivatePartner(id);
  }

  @Get('audit-logs')
  async getAuditLogs() {
    return this.adminsService.getAuditLogs();
  }
}
