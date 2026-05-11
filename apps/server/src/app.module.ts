import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppSettingsModule } from './modules/app-settings/app-settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FamilyModule } from './modules/family/family.module';
import { GenealogyModule } from './modules/genealogy/genealogy.module';
import { LocationShareModule } from './modules/location-share/location-share.module';
import { MemberModule } from './modules/member/member.module';
import { MemorialMessageModule } from './modules/memorial-message/memorial-message.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RoutePlanModule } from './modules/route-plan/route-plan.module';
import { TombModule } from './modules/tomb/tomb.module';
import { UploadModule } from './modules/upload/upload.module';
import { WorshipRecordModule } from './modules/worship-record/worship-record.module';
import { WorshipTaskModule } from './modules/worship-task/worship-task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AppSettingsModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    DashboardModule,
    AuthModule,
    FamilyModule,
    GenealogyModule,
    LocationShareModule,
    MemberModule,
    UploadModule,
    TombModule,
    WorshipTaskModule,
    WorshipRecordModule,
    MemorialMessageModule,
    RoutePlanModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
