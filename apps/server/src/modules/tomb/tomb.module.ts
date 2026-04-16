import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TombController } from './tomb.controller';
import { TombService } from './tomb.service';

@Module({
  imports: [PrismaModule],
  controllers: [TombController],
  providers: [TombService],
})
export class TombModule {}
