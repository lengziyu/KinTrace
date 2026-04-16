import { IsArray, IsString } from 'class-validator';

export class PreviewRouteDto {
  @IsString()
  familyId!: string;

  @IsArray()
  tombIds!: string[];
}
