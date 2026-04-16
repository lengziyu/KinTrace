import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class HeartbeatLocationShareDto {
  @IsString()
  memberId!: string;

  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  accuracy?: number;
}
