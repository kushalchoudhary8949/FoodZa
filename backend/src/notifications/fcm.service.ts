import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPushNotification(deviceToken: string, title: string, body: string, data?: Record<string, string>) {
    const skipFirebase = this.config.get<string>('SKIP_FIREBASE_AUTH') === 'true';

    if (skipFirebase || admin.apps.length === 0) {
      this.logger.log(`[FCM DEV MOCK] To: ${deviceToken.substring(0, 10)}... | Title: "${title}" | Body: "${body}"`);
      return true;
    }

    try {
      await admin.messaging().send({
        token: deviceToken,
        notification: { title, body },
        data: data || {},
      });
      this.logger.log(`FCM push notification sent to token: ${deviceToken.substring(0, 10)}...`);
      return true;
    } catch (error) {
      this.logger.error(`FCM Push notification failed: ${(error as Error).message}`);
      return false;
    }
  }
}
