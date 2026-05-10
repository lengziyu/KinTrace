import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TombController } from './tomb.controller';
import { TombService } from './tomb.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TombController],
  providers: [TombService],
  exports: [TombService],
})
export class TombModule {}
