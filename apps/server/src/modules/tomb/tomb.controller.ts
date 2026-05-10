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
import { CreateTombPhotoDto } from './dto/create-tomb-photo.dto';
import { CreateTombDto } from './dto/create-tomb.dto';
import { UpdateTombDto } from './dto/update-tomb.dto';
import { TombService } from './tomb.service';

@ApiTags('tombs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tombs')
export class TombController {
  constructor(
    private readonly tombService: TombService,
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
        return this.tombService.findAll(familyId);
      }

      const familyIds = await this.accessControlService.getAdminFamilyIds(user);
      return this.tombService.findAll(familyIds ?? undefined);
    }

    this.accessControlService.assertMemberFamilyAccess(user, user.familyId ?? '');
    return this.tombService.findAll(user.familyId);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const detail = await this.tombService.findOne(id);
    if (!detail) {
      return null;
    }

    await this.accessControlService.assertCanAccessFamily(user, detail.tomb.familyId);
    return detail;
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateTombDto) {
    await this.accessControlService.assertAdminFamilyAccess(user, dto.familyId);
    return this.tombService.create(dto);
  }

  @Post(':id/photos')
  async addPhoto(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateTombPhotoDto,
  ) {
    const detail = await this.tombService.findOne(id);
    if (!detail) {
      return null;
    }

    await this.accessControlService.assertCanAccessFamily(user, detail.tomb.familyId);
    if (user.tokenType === 'member') {
      this.accessControlService.assertMemberSelf(user, dto.memberId);
    }
    return this.tombService.addPhoto(id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateTombDto,
  ) {
    const detail = await this.tombService.findOne(id);
    if (!detail) {
      return null;
    }

    if (user.tokenType === 'admin') {
      await this.accessControlService.assertAdminFamilyAccess(user, detail.tomb.familyId);
    } else {
      await this.accessControlService.assertCanManageFamilyAsMember(user, detail.tomb.familyId);
    }

    return this.tombService.update(id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const detail = await this.tombService.findOne(id);
    if (!detail) {
      return null;
    }

    await this.accessControlService.assertAdminFamilyAccess(user, detail.tomb.familyId);
    return this.tombService.remove(id);
  }
}
