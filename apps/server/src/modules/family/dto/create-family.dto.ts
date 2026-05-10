import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  inviteCode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  upcomingWorshipAt?: string;

  @Type(() => Number)
  @IsInt()
  @Min(10)
  @IsOptional()
  visitRangeMeters?: number;
}
