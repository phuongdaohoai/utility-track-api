import { Module } from '@nestjs/common';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Residents } from 'src/entities/residents.entity';
import { CheckInOuts } from 'src/entities/check-in-outs.entity';
import { Staffs } from 'src/entities/staffs.entity';
import { ServiceUsageHistories } from 'src/entities/service-usage-histories.entity';
import { Services } from 'src/entities/services.entity';
import { Apartments } from 'src/entities/apartments.entity';
import { ApartmentModule } from '../apartment/apartment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Residents, CheckInOuts, Staffs, ServiceUsageHistories, Services, Apartments]),
    ApartmentModule
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService]
})
export class ResidentsModule { }
