import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateGenealogyPersonDto {
  @IsString()
  familyId!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  @IsIn(['male', 'female', 'unknown'])
  gender?: string;

  @IsInt()
  @Min(1)
  generationLevel!: number;

  @IsString()
  generationLabel!: string;

  @IsString()
  @IsOptional()
  branchName?: string | null;

  @IsString()
  @IsOptional()
  parentId?: string | null;

  @IsString()
  @IsOptional()
  spouseName?: string | null;

  @IsString()
  @IsOptional()
  @IsIn(['living', 'deceased'])
  status?: string;

  @IsString()
  @IsOptional()
  bio?: string | null;

  @IsInt()
  @Min(1)
  @IsOptional()
  sortOrder?: number;
}
