import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessControlService } from '../auth/access-control.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/request-user.interface';
import { TombService } from '../tomb/tomb.service';
import { WorshipTaskService } from '../worship-task/worship-task.service';
import { CreateWorshipRecordDto } from './dto/create-worship-record.dto';
import { WorshipRecordService } from './worship-record.service';

@ApiTags('worship-records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('worship-records')
export class WorshipRecordController {
  constructor(
    private readonly worshipRecordService: WorshipRecordService,
    private readonly worshipTaskService: WorshipTaskService,
    private readonly tombService: TombService,
    private readonly accessControlService: AccessControlService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('taskId') taskId?: string,
    @Query('tombId') tombId?: string,
  ) {
    if (!taskId && !tombId) {
      throw new BadRequestException('查询祭扫记录时至少需要 taskId 或 tombId');
    }

    if (taskId) {
      const task = await this.worshipTaskService.findOne(taskId);
      if (!task) {
        return [];
      }

      await this.accessControlService.assertCanAccessFamily(user, task.familyId);
    }

    if (tombId) {
      const detail = await this.tombService.findOne(tombId);
      if (!detail) {
        return [];
      }

      await this.accessControlService.assertCanAccessFamily(user, detail.tomb.familyId);
    }

    return this.worshipRecordService.findAll(taskId, tombId);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateWorshipRecordDto,
  ) {
    const [task, detail] = await Promise.all([
      this.worshipTaskService.findOne(dto.taskId),
      this.tombService.findOne(dto.tombId),
    ]);

    if (!task || !detail) {
      return null;
    }

    if (task.familyId !== detail.tomb.familyId) {
      throw new BadRequestException('祭扫任务与点位不属于同一家族');
    }

    await this.accessControlService.assertCanAccessFamily(user, task.familyId);
    if (user.tokenType === 'member') {
      this.accessControlService.assertMemberSelf(user, dto.memberId);
    }

    return this.worshipRecordService.create(dto);
  }
}
