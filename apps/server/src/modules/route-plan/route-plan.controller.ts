import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateRoutePlanDto } from './dto/create-route-plan.dto';
import { PreviewRouteDto } from './dto/preview-route.dto';
import { UpdateRoutePlanDto } from './dto/update-route-plan.dto';
import { RoutePlanService } from './route-plan.service';

@ApiTags('route-plans')
@Controller('route-plans')
export class RoutePlanController {
  constructor(private readonly routePlanService: RoutePlanService) {}

  @Get()
  findAll(@Query('familyId') familyId?: string) {
    return this.routePlanService.findAll(familyId);
  }

  @Post('preview')
  preview(@Body() dto: PreviewRouteDto) {
    return this.routePlanService.preview(dto.familyId, dto.tombIds);
  }

  @Post()
  create(@Body() dto: CreateRoutePlanDto) {
    return this.routePlanService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoutePlanDto) {
    return this.routePlanService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routePlanService.remove(id);
  }
}
