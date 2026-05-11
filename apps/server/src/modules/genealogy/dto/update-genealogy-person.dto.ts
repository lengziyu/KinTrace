import { PartialType } from '@nestjs/swagger';
import { CreateGenealogyPersonDto } from './create-genealogy-person.dto';

export class UpdateGenealogyPersonDto extends PartialType(CreateGenealogyPersonDto) {}
