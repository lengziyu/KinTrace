import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorshipTaskController } from './worship-task.controller';
import { WorshipTaskService } from './worship-task.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorshipTaskController],
  providers: [WorshipTaskService],
  exports: [WorshipTaskService],
})
export class WorshipTaskModule {}
