import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class StartLocationShareDto {
  @IsString()
  familyId!: string;

  @IsString()
  memberId!: string;

  @IsString()
  @IsOptional()
  title?: string;

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
