import { IsOptional, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  familyCode?: string;

  @IsOptional()
  @IsString()
  inviteCode?: string;
}
