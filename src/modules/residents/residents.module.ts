import { Module } from '@nestjs/common';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Residents } from 'src/entities/entities/residents.entity';
import { Staff } from 'src/entities/entities/staff.entity';
import { ServiceUsageHistory } from 'src/entities/entities/service-usage-history.entity';
import { Services } from 'src/entities/entities/services.entity';
import { CheckInOut } from 'src/entities/entities/check-in-out.entity';
import { Apartments } from 'src/entities/entities/apartments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Residents, CheckInOut, Staff, ServiceUsageHistory, Services, Apartments])],
  controllers: [ResidentsController],
  providers: [ResidentsService]
})
export class ResidentsModule { }
