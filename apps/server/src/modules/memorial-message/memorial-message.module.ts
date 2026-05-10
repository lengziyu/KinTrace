import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MemorialMessageController } from './memorial-message.controller';
import { MemorialMessageService } from './memorial-message.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MemorialMessageController],
  providers: [MemorialMessageService],
})
export class MemorialMessageModule {}
