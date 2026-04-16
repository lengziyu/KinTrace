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
import { CreateWorshipTaskDto } from './dto/create-worship-task.dto';
import { UpdateWorshipTaskDto } from './dto/update-worship-task.dto';
import { WorshipTaskService } from './worship-task.service';

@ApiTags('worship-tasks')
@Controller('worship-tasks')
export class WorshipTaskController {
  constructor(private readonly worshipTaskService: WorshipTaskService) {}

  @Get()
  findAll(@Query('familyId') familyId?: string) {
    return this.worshipTaskService.findAll(familyId);
  }

  @Get(':id/progress')
  getProgress(@Param('id') id: string) {
    return this.worshipTaskService.getProgress(id);
  }

  @Post()
  create(@Body() dto: CreateWorshipTaskDto) {
    return this.worshipTaskService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorshipTaskDto) {
    return this.worshipTaskService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.worshipTaskService.remove(id);
  }
}
