import { IsOptional, IsString } from 'class-validator';

export class CreateTombPhotoDto {
  @IsString()
  memberId!: string;

  @IsString()
  imageUrl!: string;

  @IsString()
  @IsOptional()
  caption?: string;
}
