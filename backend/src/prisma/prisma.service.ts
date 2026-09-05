import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super({
      log: ['warn', 'error'],
      transactionOptions: {
        maxWait: 15000,   // max time to wait for a connection from the pool (ms)
        timeout: 20000,   // max time for the entire transaction to complete (ms)
      },
    });
  }

  async onModuleInit() {
    // Retry connection up to 3 times with backoff (handles Render cold starts)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Connected to PostgreSQL (Supabase)');
        break;
      } catch (err: any) {
        this.logger.error(`PostgreSQL connection attempt ${attempt}/3 failed: ${err.message}`);
        if (attempt === 3) {
          this.logger.error('All connection attempts failed — proceeding with lazy connect');
        } else {
          await new Promise((r) => setTimeout(r, attempt * 2000));
        }
      }
    }

    // Keep-alive: ping DB every 4 minutes to prevent idle connection drops on Render/PgBouncer
    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
      } catch (err: any) {
        this.logger.warn(`Keep-alive ping failed: ${err.message}`);
        // Attempt reconnect on failed ping
        try {
          await this.$connect();
          this.logger.log('Reconnected to PostgreSQL after keep-alive failure');
        } catch (reconnectErr: any) {
          this.logger.error(`Reconnect failed: ${reconnectErr.message}`);
        }
      }
    }, 4 * 60 * 1000); // every 4 minutes
  }

  async onModuleDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from PostgreSQL');
    } catch (err: any) {
      this.logger.error(`PostgreSQL disconnect warning: ${err.message}`);
    }
  }
}
