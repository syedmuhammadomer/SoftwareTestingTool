import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TeamMemberStatus } from '../entities/team-member.entity';

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  team?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  project?: string;

  @IsOptional()
  @IsString()
  accessPreset?: string;

  @IsOptional()
  @IsEnum(TeamMemberStatus)
  status?: TeamMemberStatus;

  @IsOptional()
  @IsString()
  lastActive?: string;
}
