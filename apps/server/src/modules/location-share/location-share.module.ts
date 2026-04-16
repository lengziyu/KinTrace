import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationShareController } from './location-share.controller';
import { LocationShareService } from './location-share.service';

@Module({
  imports: [PrismaModule],
  controllers: [LocationShareController],
  providers: [LocationShareService],
  exports: [LocationShareService],
})
export class LocationShareModule {}
