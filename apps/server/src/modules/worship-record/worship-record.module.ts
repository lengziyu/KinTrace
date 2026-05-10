import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TombModule } from '../tomb/tomb.module';
import { WorshipTaskModule } from '../worship-task/worship-task.module';
import { WorshipRecordController } from './worship-record.controller';
import { WorshipRecordService } from './worship-record.service';

@Module({
  imports: [PrismaModule, AuthModule, TombModule, WorshipTaskModule],
  controllers: [WorshipRecordController],
  providers: [WorshipRecordService],
})
export class WorshipRecordModule {}
