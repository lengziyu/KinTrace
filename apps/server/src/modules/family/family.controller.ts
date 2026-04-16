import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamilyService } from './family.service';

@ApiTags('families')
@Controller('families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  findAll() {
    return this.familyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familyService.findOne(id);
  }

  @Get(':id/overview')
  getOverview(@Param('id') id: string) {
    return this.familyService.getOverview(id);
  }

  @Post()
  create(@Body() dto: CreateFamilyDto) {
    return this.familyService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFamilyDto) {
    return this.familyService.update(id, dto);
  }
}
