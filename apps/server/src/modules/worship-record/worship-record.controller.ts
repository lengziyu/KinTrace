import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateWorshipRecordDto } from './dto/create-worship-record.dto';
import { WorshipRecordService } from './worship-record.service';

@ApiTags('worship-records')
@Controller('worship-records')
export class WorshipRecordController {
  constructor(private readonly worshipRecordService: WorshipRecordService) {}

  @Get()
  findAll(@Query('taskId') taskId?: string, @Query('tombId') tombId?: string) {
    return this.worshipRecordService.findAll(taskId, tombId);
  }

  @Post()
  create(@Body() dto: CreateWorshipRecordDto) {
    return this.worshipRecordService.create(dto);
  }
}
