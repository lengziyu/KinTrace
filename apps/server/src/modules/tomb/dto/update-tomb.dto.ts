import { PartialType } from '@nestjs/swagger';
import { CreateTombDto } from './create-tomb.dto';

export class UpdateTombDto extends PartialType(CreateTombDto) {}
