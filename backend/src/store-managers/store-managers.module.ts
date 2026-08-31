import { Module } from '@nestjs/common';
import { StoreManagersController } from './store-managers.controller';
import { StoreManagersService } from './store-managers.service';

@Module({
  controllers: [StoreManagersController],
  providers: [StoreManagersService],
  exports: [StoreManagersService],
})
export class StoreManagersModule {}
