import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  // Public endpoint for customers to view active banners
  @Public()
  @Get('active')
  findAllActive() {
    return this.bannerService.findAllActive();
  }

  // Admin endpoints
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.bannerService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannerService.create(createBannerDto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto) {
    return this.bannerService.update(id, updateBannerDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
