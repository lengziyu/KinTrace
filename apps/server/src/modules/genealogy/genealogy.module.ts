import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GenealogyController } from './genealogy.controller';
import { GenealogyService } from './genealogy.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GenealogyController],
  providers: [GenealogyService],
  exports: [GenealogyService],
})
export class GenealogyModule {}
