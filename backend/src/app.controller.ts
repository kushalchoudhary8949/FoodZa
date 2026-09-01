import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getRoot() {
    return {
      message: 'FoodConnect Central NestJS Backend is Running!',
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
    };
  }
}
