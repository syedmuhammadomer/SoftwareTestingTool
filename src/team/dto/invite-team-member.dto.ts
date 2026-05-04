import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class InviteTeamMemberDto {
  @IsString()
  @MaxLength(120)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(100)
  role: string;

  @IsString()
  @MaxLength(100)
  team: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  project?: string;

  @IsString()
  @IsIn(['full', 'project', 'review'])
  accessPreset: string;

  @IsBoolean()
  sendCopy: boolean;

  @IsBoolean()
  addWelcomeNote: boolean;
}
