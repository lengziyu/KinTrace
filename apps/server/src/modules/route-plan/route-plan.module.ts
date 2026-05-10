import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RoutePlanController } from './route-plan.controller';
import { RoutePlanService } from './route-plan.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RoutePlanController],
  providers: [RoutePlanService],
})
export class RoutePlanModule {}
