import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MemorialMessageController } from './memorial-message.controller';
import { MemorialMessageService } from './memorial-message.service';

@Module({
  imports: [PrismaModule],
  controllers: [MemorialMessageController],
  providers: [MemorialMessageService],
})
export class MemorialMessageModule {}
