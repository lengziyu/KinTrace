import {
  Body,
  Controller,
  Delete,
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
import { CreateWorshipTaskDto } from './dto/create-worship-task.dto';
import { UpdateWorshipTaskDto } from './dto/update-worship-task.dto';
import { WorshipTaskService } from './worship-task.service';

@ApiTags('worship-tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('worship-tasks')
export class WorshipTaskController {
  constructor(
    private readonly worshipTaskService: WorshipTaskService,
    private readonly accessControlService: AccessControlService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('familyId') familyId?: string,
  ) {
    if (user.tokenType === 'admin') {
      if (familyId) {
        await this.accessControlService.assertAdminFamilyAccess(user, familyId);
        return this.worshipTaskService.findAll(familyId);
      }

      const familyIds = await this.accessControlService.getAdminFamilyIds(user);
      return this.worshipTaskService.findAll(familyIds ?? undefined);
    }

    this.accessControlService.assertMemberFamilyAccess(user, user.familyId ?? '');
    return this.worshipTaskService.findAll(user.familyId);
  }

  @Get(':id/progress')
  async getProgress(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const task = await this.worshipTaskService.findOne(id);
    if (!task) {
      return null;
    }

    await this.accessControlService.assertCanAccessFamily(user, task.familyId);
    return this.worshipTaskService.getProgress(id);
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateWorshipTaskDto) {
    await this.accessControlService.assertAdminFamilyAccess(user, dto.familyId);
    return this.worshipTaskService.create(dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorshipTaskDto,
  ) {
    const task = await this.worshipTaskService.findOne(id);
    if (!task) {
      return null;
    }

    await this.accessControlService.assertAdminFamilyAccess(user, task.familyId);
    return this.worshipTaskService.update(id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const task = await this.worshipTaskService.findOne(id);
    if (!task) {
      return null;
    }

    await this.accessControlService.assertAdminFamilyAccess(user, task.familyId);
    return this.worshipTaskService.remove(id);
  }
}
