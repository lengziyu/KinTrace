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
import { CreateGenealogyPersonDto } from './dto/create-genealogy-person.dto';
import { UpdateGenealogyPersonDto } from './dto/update-genealogy-person.dto';
import { GenealogyService } from './genealogy.service';

@ApiTags('genealogy')
@Controller('genealogy')
export class GenealogyController {
  constructor(
    private readonly genealogyService: GenealogyService,
    private readonly accessControlService: AccessControlService,
  ) {}

  @Get('tree')
  getTree(
    @Query('familyId') familyId?: string,
    @Query('familyCode') familyCode?: string,
  ) {
    return this.genealogyService.getTreeView({ familyId, familyCode });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('people')
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('familyId') familyId: string,
  ) {
    await this.accessControlService.assertAdminFamilyAccess(user, familyId);
    return this.genealogyService.findAll(familyId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('people')
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateGenealogyPersonDto,
  ) {
    await this.accessControlService.assertAdminFamilyAccess(user, dto.familyId);
    return this.genealogyService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('people/:id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateGenealogyPersonDto,
  ) {
    const current = await this.genealogyService.findOne(id);
    if (!current) {
      return null;
    }

    await this.accessControlService.assertAdminFamilyAccess(user, current.familyId);
    return this.genealogyService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('people/:id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const current = await this.genealogyService.findOne(id);
    if (!current) {
      return null;
    }

    await this.accessControlService.assertAdminFamilyAccess(user, current.familyId);
    return this.genealogyService.remove(id);
  }
}
