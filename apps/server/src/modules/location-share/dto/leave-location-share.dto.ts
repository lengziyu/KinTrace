import { IsString } from 'class-validator';

export class LeaveLocationShareDto {
  @IsString()
  memberId!: string;
}
