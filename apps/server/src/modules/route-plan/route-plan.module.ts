import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RoutePlanController } from './route-plan.controller';
import { RoutePlanService } from './route-plan.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoutePlanController],
  providers: [RoutePlanService],
})
export class RoutePlanModule {}
