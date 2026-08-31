import { IsString, IsEnum, IsOptional } from 'class-validator';
import { IssueCategory, IssueStatus } from '@prisma/client';

export class CreateIssueDto {
  @IsEnum(IssueCategory)
  category: IssueCategory;

  @IsString()
  subject: string;

  @IsString()
  initialMessage: string;
}

export class AddIssueMessageDto {
  @IsString()
  message: string;
}

export class UpdateIssueStatusDto {
  @IsEnum(IssueStatus)
  status: IssueStatus;
}
