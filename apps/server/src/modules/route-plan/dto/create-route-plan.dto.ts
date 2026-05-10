import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoutePlanDto {
  @IsString()
  familyId!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  tombIds!: string[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  morningTombCount?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  afternoonTombCount?: number;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  createdByMemberId?: string;
}
