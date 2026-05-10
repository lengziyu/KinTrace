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
import { CreateMemorialMessageDto } from './dto/create-memorial-message.dto';
import { ReviewMemorialMessageDto } from './dto/review-memorial-message.dto';
import { MemorialMessageService } from './memorial-message.service';

@ApiTags('memorial-messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('memorial-messages')
export class MemorialMessageController {
  constructor(
    private readonly memorialMessageService: MemorialMessageService,
    private readonly accessControlService: AccessControlService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('familyId') familyId?: string,
    @Query('tombId') tombId?: string,
    @Query('status') status?: string,
  ) {
    if (user.tokenType === 'admin') {
      if (familyId) {
        await this.accessControlService.assertAdminFamilyAccess(user, familyId);
        return this.memorialMessageService.findAll(familyId, tombId, status);
      }

      const familyIds = await this.accessControlService.getAdminFamilyIds(user);
      return this.memorialMessageService.findAll(familyIds ?? undefined, tombId, status);
    }

    this.accessControlService.assertMemberFamilyAccess(user, user.familyId ?? '');
    return this.memorialMessageService.findAll(user.familyId, tombId, status);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateMemorialMessageDto,
  ) {
    await this.accessControlService.assertCanAccessFamily(user, dto.familyId);
    if (user.tokenType === 'member') {
      this.accessControlService.assertMemberSelf(user, dto.memberId);
    }
    return this.memorialMessageService.create(dto);
  }

  @Patch(':id/review')
  async review(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReviewMemorialMessageDto,
  ) {
    const message = await this.memorialMessageService.findOne(id);
    if (!message) {
      return null;
    }

    await this.accessControlService.assertAdminFamilyAccess(user, message.familyId);
    return this.memorialMessageService.review(id, dto.status);
  }
}
