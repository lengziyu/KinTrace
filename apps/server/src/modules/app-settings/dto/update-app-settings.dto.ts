import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { PointMarkerPresetKey } from '../app-settings.types';

const pointMarkerPresetKeys: PointMarkerPresetKey[] = [
  'star',
  'lotus',
  'mountain',
  'leaf',
];

export class UpdateAppSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appNameZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appNameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({ enum: pointMarkerPresetKeys })
  @IsOptional()
  @IsIn(pointMarkerPresetKeys)
  pointMarkerPreset?: PointMarkerPresetKey;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pointMarkerIconUrl?: string;
}
