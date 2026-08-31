import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from './fcm.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * Register a user's device token for FCM push
   */
  async registerDeviceToken(userId: string, token: string, platform?: string) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, isActive: true },
      create: { userId, token, platform },
    });
  }

  /**
   * Remove a device token (logout/unregister)
   */
  async unregisterDeviceToken(token: string) {
    return this.prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }

  /**
   * Create DB notification & trigger push notification to user's registered devices
   */
  async createAndSend(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ) {
    // 1. Create DB record
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.parse(JSON.stringify(data)) : undefined,
      },
    });

    // 2. Fetch active device tokens
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
    });

    // 3. Send push to all active devices
    for (const t of tokens) {
      await this.fcmService.sendPushNotification(
        t.token,
        title,
        message,
        data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
      );
    }

    return notification;
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
