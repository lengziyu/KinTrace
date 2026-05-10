import {
  Body,
  Controller,
  Delete,
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
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { MemberService } from './member.service';

@ApiTags('members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('members')
export class MemberController {
  constructor(
    private readonly memberService: MemberService,
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
        return this.memberService.findAll(familyId);
      }

      const familyIds = await this.accessControlService.getAdminFamilyIds(user);
      return this.memberService.findAll(familyIds ?? undefined);
    }

    this.accessControlService.assertMemberFamilyAccess(user, user.familyId ?? '');
    return this.memberService.findAll(user.familyId);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateMyProfileDto,
  ) {
    if (user.tokenType !== 'member') {
      throw new ForbiddenException('当前账号不支持修改成员资料');
    }

    return this.memberService.updateProfile(user.sub, dto);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const member = await this.memberService.findOne(id);
    if (!member) {
      return null;
    }

    await this.accessControlService.assertCanAccessFamily(user, member.familyId);
    return member;
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateMemberDto) {
    await this.accessControlService.assertAdminFamilyAccess(user, dto.familyId);
    return this.memberService.create(dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    const member = await this.memberService.findOne(id);
    if (!member) {
      return null;
    }

    await this.accessControlService.assertAdminFamilyAccess(user, member.familyId);
    return this.memberService.update(id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const member = await this.memberService.findOne(id);
    if (!member) {
      return null;
    }

    await this.accessControlService.assertAdminFamilyAccess(user, member.familyId);
    return this.memberService.remove(id);
  }
}
