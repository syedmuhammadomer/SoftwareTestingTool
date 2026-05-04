import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserStoryPriority, UserStoryStatus } from '../entities/user-story.entity';

export class CreateUserStoryDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(100)
  userRole: string;

  @IsString()
  description: string;

  @IsEnum(UserStoryPriority)
  priority: UserStoryPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  assigneeName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentNames?: string[];

  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @IsOptional()
  @IsEnum(UserStoryStatus)
  status?: UserStoryStatus;
}
