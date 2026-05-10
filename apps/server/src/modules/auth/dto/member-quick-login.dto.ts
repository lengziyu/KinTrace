import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class MemberQuickLoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^1\d{10}$/, {
    message: '请输入正确的 11 位手机号',
  })
  phone!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  familyCode?: string;

  @IsString()
  @IsOptional()
  inviteCode?: string;
}
