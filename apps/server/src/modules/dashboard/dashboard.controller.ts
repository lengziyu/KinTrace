import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessControlService } from '../auth/access-control.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/request-user.interface';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly accessControlService: AccessControlService,
  ) {}

  @Get('summary')
  async getSummary(
    @CurrentUser() user: RequestUser,
    @Query('familyId') familyId?: string,
  ) {
    const adminUser = this.accessControlService.requireAdmin(user);

    if (familyId) {
      await this.accessControlService.assertAdminFamilyAccess(adminUser, familyId);
      return this.dashboardService.getSummary([familyId]);
    }

    const familyIds = await this.accessControlService.getAdminFamilyIds(adminUser);
    return this.dashboardService.getSummary(familyIds);
  }

  @Get('admin-snapshot')
  async getAdminSnapshot(
    @CurrentUser() user: RequestUser,
    @Query('familyId') familyId?: string,
  ) {
    const adminUser = this.accessControlService.requireAdmin(user);

    if (familyId) {
      await this.accessControlService.assertAdminFamilyAccess(adminUser, familyId);
      return this.dashboardService.getAdminSnapshot([familyId]);
    }

    const familyIds = await this.accessControlService.getAdminFamilyIds(adminUser);
    return this.dashboardService.getAdminSnapshot(familyIds);
  }
}
