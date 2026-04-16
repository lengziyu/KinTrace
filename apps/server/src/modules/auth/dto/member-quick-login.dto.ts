import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MemberQuickLoginDto {
  @IsString()
  @IsNotEmpty()
  nickname!: string;

  @IsString()
  @IsOptional()
  familyCode?: string;

  @IsString()
  @IsOptional()
  inviteCode?: string;
}
