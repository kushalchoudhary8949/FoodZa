import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { StoresModule } from './stores/stores.module';
import { StoreManagersModule } from './store-managers/store-managers.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { OffersModule } from './offers/offers.module';
import { SalesModule } from './sales/sales.module';
import { IssuesModule } from './issues/issues.module';
import { AdminsModule } from './admins/admins.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // BullMQ (job queue backed by Redis with Upstash / TLS support)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST', 'localhost');
        const port = Number(config.get('REDIS_PORT', 6379));
        const password = config.get<string>('REDIS_PASSWORD') || undefined;
        const isTls = config.get<string>('REDIS_TLS') === 'true' || host.includes('upstash.io');

        return {
          connection: {
            host,
            port,
            password,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            tls: isTls ? { rejectUnauthorized: false } : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),

    // Core
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    StoresModule,
    StoreManagersModule,
    MenuModule,
    OrdersModule,
    DeliveryModule,
    PaymentsModule,
    NotificationsModule,
    RealtimeModule,
    OffersModule,
    SalesModule,
    IssuesModule,
    AdminsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
