import { IsString } from 'class-validator';

export class ReviewMemorialMessageDto {
  @IsString()
  status!: string;
}
