import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staffs } from 'src/entities/staffs.entity';
import { Permissions } from 'src/entities/permissions.entity';
import { Roles } from 'src/entities/roles.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Staffs,Permissions,Roles])],
  controllers: [StaffController],
  providers: [StaffService]
})
export class StaffModule {}

