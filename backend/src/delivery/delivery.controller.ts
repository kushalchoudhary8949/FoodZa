import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { UserRole, OnlineStatus } from '@prisma/client';
import { DeliveryService } from './delivery.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { VerifyOtpDto, CollectPaymentDto } from './dto/delivery.dto';

@Controller()
@Roles(UserRole.DELIVERY_PARTNER)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('delivery-partners/profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.getProfile(user.deliveryPartnerId!);
  }

  @Post('delivery-partners/go-online')
  async goOnline(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.setOnlineStatus(user.deliveryPartnerId!, OnlineStatus.ONLINE);
  }

  @Post('delivery-partners/go-offline')
  async goOffline(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.setOnlineStatus(user.deliveryPartnerId!, OnlineStatus.OFFLINE);
  }

  @Get('delivery-partners/my-requests')
  async getPendingRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.getPendingRequests(user.deliveryPartnerId!);
  }

  @Get('delivery-partners/my-deliveries')
  async getMyDeliveries(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.getDeliveries(user.deliveryPartnerId!);
  }

  @Post('delivery-requests/:id/accept')
  async acceptRequest(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.acceptRequest(id, user.deliveryPartnerId!, user);
  }

  @Post('deliveries/:orderId/accept')
  async acceptOrderByOrderId(@Param('orderId') orderId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.acceptRequest(orderId, user.deliveryPartnerId!, user);
  }

  @Post('delivery-requests/:id/reject')
  async rejectRequest(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.rejectRequest(id, user.deliveryPartnerId!, user);
  }

  @Post('deliveries/:orderId/pickup')
  async pickupOrder(@Param('orderId') orderId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.pickupOrder(orderId, user.deliveryPartnerId!, user);
  }

  @Post('deliveries/:orderId/out-for-delivery')
  async outForDelivery(@Param('orderId') orderId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.outForDelivery(orderId, user.deliveryPartnerId!, user);
  }

  @Post('deliveries/:orderId/verify-otp')
  async verifyOtp(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyOtpDto,
  ) {
    return this.deliveryService.verifyOtp(orderId, user.deliveryPartnerId!, dto.otp);
  }

  @Post('deliveries/:orderId/payment')
  async collectPayment(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CollectPaymentDto,
  ) {
    return this.deliveryService.collectPayment(orderId, user.deliveryPartnerId!, dto.amountCollected);
  }

  @Post('deliveries/:orderId/complete')
  async completeDelivery(@Param('orderId') orderId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.completeDelivery(orderId, user.deliveryPartnerId!, user);
  }

}
