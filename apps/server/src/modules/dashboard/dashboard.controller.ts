import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Query('familyId') familyId?: string) {
    return this.dashboardService.getSummary(familyId);
  }

  @Get('admin-snapshot')
  getAdminSnapshot(@Query('familyId') familyId?: string) {
    return this.dashboardService.getAdminSnapshot(familyId);
  }
}
