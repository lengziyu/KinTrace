import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorshipTaskController } from './worship-task.controller';
import { WorshipTaskService } from './worship-task.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorshipTaskController],
  providers: [WorshipTaskService],
})
export class WorshipTaskModule {}
