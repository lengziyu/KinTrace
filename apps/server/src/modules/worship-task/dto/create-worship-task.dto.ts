import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateWorshipTaskDto {
  @IsString()
  familyId!: string;

  @Type(() => Number)
  @IsInt()
  year!: number;

  @IsString()
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  @IsOptional()
  status?: string;
}
