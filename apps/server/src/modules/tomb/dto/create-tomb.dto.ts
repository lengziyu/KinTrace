import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTombDto {
  @IsString()
  familyId!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  titleName?: string;

  @IsString()
  @IsOptional()
  generation?: string;

  @IsString()
  @IsOptional()
  branchName?: string;

  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @IsString()
  @IsOptional()
  areaName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;
}
