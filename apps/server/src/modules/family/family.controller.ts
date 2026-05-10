import {
  Body,
  Controller,
  ForbiddenException,
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
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamilyService } from './family.service';

@ApiTags('families')
@Controller('families')
export class FamilyController {
  constructor(
    private readonly familyService: FamilyService,
    private readonly accessControlService: AccessControlService,
  ) {}

  @Get()
  findAll() {
    return this.familyService.findAll();
  }

  @Get('resolve/access')
  resolveByAccess(
    @Query('familyCode') familyCode?: string,
    @Query('inviteCode') inviteCode?: string,
  ) {
    return this.familyService.resolveByAccess(familyCode, inviteCode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familyService.findOne(id);
  }

  @Get(':id/overview')
  getOverview(@Param('id') id: string) {
    return this.familyService.getOverview(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateFamilyDto) {
    const adminUser = this.accessControlService.requireAdmin(user);
    if (adminUser.role !== 'super_admin') {
      throw new ForbiddenException('仅超级管理员可以创建新的家族空间');
    }
    return this.familyService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyDto,
  ) {
    const currentUser = this.accessControlService.requireUser(user);

    if (currentUser.tokenType === 'member') {
      await this.accessControlService.assertCanManageFamilyAsMember(currentUser, id);
    } else {
      await this.accessControlService.assertAdminFamilyAccess(currentUser, id);
    }

    return this.familyService.update(id, dto);
  }
}
