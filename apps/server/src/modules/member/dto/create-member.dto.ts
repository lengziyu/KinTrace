import { IsOptional, IsString } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  familyId!: string;

  @IsString()
  nickname!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
