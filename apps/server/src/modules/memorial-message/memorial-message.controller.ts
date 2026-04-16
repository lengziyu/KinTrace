import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateMemorialMessageDto } from './dto/create-memorial-message.dto';
import { ReviewMemorialMessageDto } from './dto/review-memorial-message.dto';
import { MemorialMessageService } from './memorial-message.service';

@ApiTags('memorial-messages')
@Controller('memorial-messages')
export class MemorialMessageController {
  constructor(
    private readonly memorialMessageService: MemorialMessageService,
  ) {}

  @Get()
  findAll(
    @Query('familyId') familyId?: string,
    @Query('tombId') tombId?: string,
    @Query('status') status?: string,
  ) {
    return this.memorialMessageService.findAll(familyId, tombId, status);
  }

  @Post()
  create(@Body() dto: CreateMemorialMessageDto) {
    return this.memorialMessageService.create(dto);
  }

  @Patch(':id/review')
  review(@Param('id') id: string, @Body() dto: ReviewMemorialMessageDto) {
    return this.memorialMessageService.review(id, dto.status);
  }
}
