import { PartialType } from '@nestjs/swagger';
import { CreateWorshipTaskDto } from './create-worship-task.dto';

export class UpdateWorshipTaskDto extends PartialType(CreateWorshipTaskDto) {}
