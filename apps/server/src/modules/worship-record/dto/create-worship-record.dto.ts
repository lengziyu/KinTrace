import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorshipRecordDto {
  @IsString()
  taskId!: string;

  @IsString()
  tombId!: string;

  @IsString()
  memberId!: string;

  @IsString()
  actionType!: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsDateString()
  @IsOptional()
  worshipTime?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  checkInLng?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  checkInLat?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  checkInAccuracy?: number;
}
