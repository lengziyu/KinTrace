import { IsOptional, IsString } from 'class-validator';

export class CreateMemorialMessageDto {
  @IsString()
  familyId!: string;

  @IsString()
  tombId!: string;

  @IsString()
  memberId!: string;

  @IsString()
  content!: string;

  @IsString()
  @IsOptional()
  status?: string;
}
