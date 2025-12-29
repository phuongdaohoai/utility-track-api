import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { ResidentsModule } from './modules/residents/residents.module';
import { StaffModule } from './modules/staff/staff.module';
import { ServicesUsedModule } from './modules/services-used/services-used.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServiceUsageModule } from './modules/history/service-usage.module';
import { checkInModule } from './modules/check_in/checkIn.module';
import { RolesModule } from './modules/roles/roles.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadModule } from './modules/upload/upload.module';
import { SystemConfigModule } from './modules/system_config/system_config.module'
import { ApartmentModule } from './modules/apartment/apartment.module';

@Module({
  imports: [
    /* ================= LOAD .ENV ================= */
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    /* ================= DATABASE (SQL SERVER) ================= */
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE, // ✅ khớp env

      synchronize: false,
      autoLoadEntities: true,

      /* 🔥 FIX LỖI TLS IP */
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      logging: true,
      extra: {
        timezone: '+07:00',
      },
    }),

    /* ================= BUSINESS MODULES ================= */
    ResidentsModule,
    StaffModule,
    ServicesUsedModule,
    AuthModule,
    ServiceUsageModule,
    checkInModule,
    RolesModule,
    DashboardModule,
    UploadModule,
    SystemConfigModule,
    ApartmentModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
