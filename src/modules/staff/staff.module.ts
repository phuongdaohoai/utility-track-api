import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staffs } from 'src/entities/staffs.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Staffs])],
  controllers: [StaffController],
  providers: [StaffService]
})
export class StaffModule {}
