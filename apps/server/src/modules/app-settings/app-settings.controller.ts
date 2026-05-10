import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessControlService } from '../auth/access-control.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/request-user.interface';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

@ApiTags('app-settings')
@Controller('app-settings')
export class AppSettingsController {
  constructor(
    private readonly appSettingsService: AppSettingsService,
    private readonly accessControlService: AccessControlService,
  ) {}

  @Get()
  getSettings() {
    return this.appSettingsService.getSettings();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch()
  updateSettings(@CurrentUser() user: RequestUser, @Body() dto: UpdateAppSettingsDto) {
    const adminUser = this.accessControlService.requireAdmin(user);
    if (adminUser.role !== 'super_admin') {
      throw new ForbiddenException('仅超级管理员可以更新平台级品牌设置');
    }
    return this.appSettingsService.updateSettings(dto);
  }
}
