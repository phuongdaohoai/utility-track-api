import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ResidentsModule } from './residents/residents.module';
import { StaffModule } from './staff/staff.module';
import { ServicesUsedModule } from './services-used/services-used.module';
import { AuthModule } from './auth/auth.module';
import { ServiceUsageModule } from './history/service-usage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type:'mssql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      
      extra:{
        trustServerCertificate: true
      },

      autoLoadEntities: true,
    }),
    ResidentsModule,
    StaffModule,
    ServicesUsedModule,
    ServicesUsedModule,
    AuthModule,
    ServiceUsageModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
