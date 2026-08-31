import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IssuesService } from './issues.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateIssueDto, AddIssueMessageDto, UpdateIssueStatusDto } from './dto/issues.dto';

@Controller('issues')
@Roles(UserRole.MANAGER, UserRole.ADMIN)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @Roles(UserRole.MANAGER)
  async createIssue(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateIssueDto) {
    return this.issuesService.createIssue(user, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.issuesService.findAll(user);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.issuesService.findById(id, user);
  }

  @Post(':id/messages')
  async addMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddIssueMessageDto,
  ) {
    return this.issuesService.addMessage(id, user, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateIssueStatusDto) {
    return this.issuesService.updateStatus(id, dto);
  }
}
