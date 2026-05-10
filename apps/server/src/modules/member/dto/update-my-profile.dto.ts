import { IsOptional, IsString } from 'class-validator';

export class UpdateMyProfileDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
