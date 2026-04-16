import { IsArray, IsOptional, IsString } from 'class-validator';

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

  @IsString()
  @IsOptional()
  createdByMemberId?: string;
}
