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
import { HeartbeatLocationShareDto } from './dto/heartbeat-location-share.dto';
import { LeaveLocationShareDto } from './dto/leave-location-share.dto';
import { StartLocationShareDto } from './dto/start-location-share.dto';
import { LocationShareService } from './location-share.service';

@ApiTags('location-share-sessions')
@Controller('location-share-sessions')
export class LocationShareController {
  constructor(private readonly locationShareService: LocationShareService) {}

  @Get('active')
  getActiveSession(@Query('familyId') familyId: string) {
    return this.locationShareService.getActiveSession(familyId);
  }

  @Post('start')
  start(@Body() dto: StartLocationShareDto) {
    return this.locationShareService.start(dto);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @Body() dto: HeartbeatLocationShareDto) {
    return this.locationShareService.join(id, dto);
  }

  @Post(':id/heartbeat')
  heartbeat(@Param('id') id: string, @Body() dto: HeartbeatLocationShareDto) {
    return this.locationShareService.heartbeat(id, dto);
  }

  @Patch(':id/leave')
  leave(@Param('id') id: string, @Body() dto: LeaveLocationShareDto) {
    return this.locationShareService.leave(id, dto);
  }

  @Patch(':id/close')
  close(@Param('id') id: string) {
    return this.locationShareService.close(id);
  }
}
