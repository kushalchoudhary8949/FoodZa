import { Controller, Get, Post, Param, Body, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RegisterDeviceTokenDto } from './dto/notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Post('device-token')
  async registerToken(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceTokenDto) {
    return this.notificationsService.registerDeviceToken(user.id, dto.token, dto.platform);
  }

  @Delete('device-token/:token')
  async unregisterToken(@Param('token') token: string) {
    return this.notificationsService.unregisterDeviceToken(token);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAsRead(id, user.id);
  }
}
