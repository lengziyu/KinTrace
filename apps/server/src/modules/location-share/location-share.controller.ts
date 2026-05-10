import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessControlService } from '../auth/access-control.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/request-user.interface';
import { HeartbeatLocationShareDto } from './dto/heartbeat-location-share.dto';
import { LeaveLocationShareDto } from './dto/leave-location-share.dto';
import { StartLocationShareDto } from './dto/start-location-share.dto';
import { LocationShareService } from './location-share.service';

@ApiTags('location-share-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('location-share-sessions')
export class LocationShareController {
  constructor(
    private readonly locationShareService: LocationShareService,
    private readonly accessControlService: AccessControlService,
  ) {}

  @Get('active')
  async getActiveSession(
    @CurrentUser() user: RequestUser,
    @Query('familyId') familyId: string,
  ) {
    await this.accessControlService.assertCanAccessFamily(user, familyId);
    return this.locationShareService.getActiveSession(familyId);
  }

  @Post('start')
  async start(@CurrentUser() user: RequestUser, @Body() dto: StartLocationShareDto) {
    await this.accessControlService.assertCanAccessFamily(user, dto.familyId);
    if (user.tokenType === 'member') {
      this.accessControlService.assertMemberSelf(user, dto.memberId);
    }
    return this.locationShareService.start(dto);
  }

  @Post(':id/join')
  async join(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: HeartbeatLocationShareDto,
  ) {
    const session = await this.locationShareService.findSessionOrThrow(id);
    await this.accessControlService.assertCanAccessFamily(user, session.familyId);
    if (user.tokenType === 'member') {
      this.accessControlService.assertMemberSelf(user, dto.memberId);
    }
    return this.locationShareService.join(id, dto);
  }

  @Post(':id/heartbeat')
  async heartbeat(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: HeartbeatLocationShareDto,
  ) {
    const session = await this.locationShareService.findSessionOrThrow(id);
    await this.accessControlService.assertCanAccessFamily(user, session.familyId);
    if (user.tokenType === 'member') {
      this.accessControlService.assertMemberSelf(user, dto.memberId);
    }
    return this.locationShareService.heartbeat(id, dto);
  }

  @Patch(':id/leave')
  async leave(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: LeaveLocationShareDto,
  ) {
    const session = await this.locationShareService.findSessionOrThrow(id);
    await this.accessControlService.assertCanAccessFamily(user, session.familyId);
    if (user.tokenType === 'member') {
      this.accessControlService.assertMemberSelf(user, dto.memberId);
    }
    return this.locationShareService.leave(id, dto);
  }

  @Patch(':id/close')
  async close(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const session = await this.locationShareService.findSessionOrThrow(id);
    await this.accessControlService.assertCanAccessFamily(user, session.familyId);
    return this.locationShareService.close(id);
  }
}
