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
import { CreateRoutePlanDto } from './dto/create-route-plan.dto';
import { PreviewRouteDto } from './dto/preview-route.dto';
import { UpdateRoutePlanDto } from './dto/update-route-plan.dto';
import { RoutePlanService } from './route-plan.service';

@ApiTags('route-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('route-plans')
export class RoutePlanController {
  constructor(
    private readonly routePlanService: RoutePlanService,
    private readonly accessControlService: AccessControlService,
  ) {}

  private async assertManagePermission(user: RequestUser, familyId: string) {
    if (user.tokenType === 'admin') {
      await this.accessControlService.assertAdminFamilyAccess(user, familyId);
      return;
    }

    await this.accessControlService.assertCanManageFamilyAsMember(user, familyId);
  }

  @Get()
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('familyId') familyId?: string,
  ) {
    if (user.tokenType === 'admin') {
      if (familyId) {
        await this.accessControlService.assertAdminFamilyAccess(user, familyId);
        return this.routePlanService.findAll(familyId);
      }

      const familyIds = await this.accessControlService.getAdminFamilyIds(user);
      return this.routePlanService.findAll(familyIds ?? undefined);
    }

    this.accessControlService.assertMemberFamilyAccess(user, user.familyId ?? '');
    return this.routePlanService.findAll(user.familyId);
  }

  @Post('preview')
  async preview(@CurrentUser() user: RequestUser, @Body() dto: PreviewRouteDto) {
    await this.accessControlService.assertCanAccessFamily(user, dto.familyId);
    return this.routePlanService.preview(dto.familyId, dto.tombIds);
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateRoutePlanDto) {
    await this.assertManagePermission(user, dto.familyId);
    return this.routePlanService.create(dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoutePlanDto,
  ) {
    const routePlan = await this.routePlanService.findOne(id);
    if (!routePlan) {
      return null;
    }

    await this.assertManagePermission(user, routePlan.familyId);
    return this.routePlanService.update(id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const routePlan = await this.routePlanService.findOne(id);
    if (!routePlan) {
      return null;
    }

    await this.assertManagePermission(user, routePlan.familyId);
    return this.routePlanService.remove(id);
  }
}
