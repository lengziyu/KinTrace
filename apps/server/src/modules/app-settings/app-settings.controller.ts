import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

@ApiTags('app-settings')
@Controller('app-settings')
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Get()
  getSettings() {
    return this.appSettingsService.getSettings();
  }

  @Patch()
  updateSettings(@Body() dto: UpdateAppSettingsDto) {
    return this.appSettingsService.updateSettings(dto);
  }
}
