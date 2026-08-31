import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { StoreManagersService } from './store-managers.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateManagerDto, UpdateManagerDto, AssignStoreDto } from './dto/store-manager.dto';

@Controller('store-managers')
@Roles(UserRole.ADMIN)
export class StoreManagersController {
  constructor(private readonly storeManagersService: StoreManagersService) {}

  @Get()
  async findAll() {
    return this.storeManagersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.storeManagersService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateManagerDto) {
    return this.storeManagersService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateManagerDto) {
    return this.storeManagersService.update(id, dto);
  }

  @Post(':id/assign-store')
  async assignStore(@Param('id') id: string, @Body() dto: AssignStoreDto) {
    return this.storeManagersService.assignStore(id, dto);
  }

  @Post(':id/activate')
  async activate(@Param('id') id: string) {
    return this.storeManagersService.activate(id);
  }

  @Post(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.storeManagersService.deactivate(id);
  }
}
