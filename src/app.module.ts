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
import { RolesModule } from './modules/roles/roles.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadModule } from './modules/upload/upload.module';
import { ApartmentModule } from './modules/apartment/apartment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,

      extra: {
        trustServerCertificate: true,
        timezone: '+07:00',
      },

      autoLoadEntities: true,
    }),
    ResidentsModule,
    StaffModule,
    ServicesUsedModule,
    AuthModule,
    ServiceUsageModule,
    RolesModule,
    DashboardModule,
    UploadModule,
    ApartmentModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
