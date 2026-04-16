import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTombPhotoDto } from './dto/create-tomb-photo.dto';
import { CreateTombDto } from './dto/create-tomb.dto';
import { UpdateTombDto } from './dto/update-tomb.dto';
import { TombService } from './tomb.service';

@ApiTags('tombs')
@Controller('tombs')
export class TombController {
  constructor(private readonly tombService: TombService) {}

  @Get()
  findAll(@Query('familyId') familyId?: string) {
    return this.tombService.findAll(familyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tombService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTombDto) {
    return this.tombService.create(dto);
  }

  @Post(':id/photos')
  addPhoto(@Param('id') id: string, @Body() dto: CreateTombPhotoDto) {
    return this.tombService.addPhoto(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTombDto) {
    return this.tombService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tombService.remove(id);
  }
}
