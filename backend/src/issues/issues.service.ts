import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UserRole, IssueStatus } from '@prisma/client';
import { CreateIssueDto, AddIssueMessageDto, UpdateIssueStatusDto } from './dto/issues.dto';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async createIssue(user: AuthenticatedUser, dto: CreateIssueDto) {
    if (user.role !== UserRole.MANAGER || !user.restaurantId) {
      throw new ForbiddenException('Only assigned store managers can create issues');
    }

    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.issue.create({
        data: {
          restaurantId: user.restaurantId!,
          createdByUserId: user.id,
          category: dto.category,
          subject: dto.subject,
          status: IssueStatus.OPEN,
          messages: {
            create: {
              senderUserId: user.id,
              message: dto.initialMessage,
            },
          },
        },
        include: {
          restaurant: { select: { name: true } },
          createdBy: { select: { name: true, role: true } },
          messages: { include: { sender: { select: { name: true, role: true } } } },
        },
      });

      this.realtimeGateway.emitIssueMessage(issue.id, issue.restaurantId, issue.messages[0]);
      return issue;
    });
  }

  async findAll(user: AuthenticatedUser) {
    if (user.role === UserRole.MANAGER) {
      return this.prisma.issue.findMany({
        where: { restaurantId: user.restaurantId! },
        include: {
          restaurant: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Admin sees all issues
    return this.prisma.issue.findMany({
      include: {
        restaurant: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthenticatedUser) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        restaurant: { select: { name: true } },
        createdBy: { select: { name: true, role: true } },
        messages: {
          include: { sender: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!issue) throw new NotFoundException('Issue not found');

    if (user.role === UserRole.MANAGER && issue.restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return issue;
  }

  async addMessage(issueId: string, user: AuthenticatedUser, dto: AddIssueMessageDto) {
    const issue = await this.findById(issueId, user);

    const message = await this.prisma.issueMessage.create({
      data: {
        issueId,
        senderUserId: user.id,
        message: dto.message,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    this.realtimeGateway.emitIssueMessage(issueId, issue.restaurantId, message);
    return message;
  }

  async updateStatus(issueId: string, dto: UpdateIssueStatusDto) {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundException('Issue not found');

    return this.prisma.issue.update({
      where: { id: issueId },
      data: {
        status: dto.status,
        resolvedAt: dto.status === IssueStatus.RESOLVED ? new Date() : undefined,
      },
    });
  }
}
