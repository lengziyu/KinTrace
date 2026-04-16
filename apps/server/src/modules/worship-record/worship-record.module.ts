import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorshipRecordController } from './worship-record.controller';
import { WorshipRecordService } from './worship-record.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorshipRecordController],
  providers: [WorshipRecordService],
})
export class WorshipRecordModule {}
