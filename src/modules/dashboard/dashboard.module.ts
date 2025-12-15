import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckInOuts } from 'src/entities/check-in-outs.entity';
import { ServiceUsageHistories } from 'src/entities/service-usage-histories.entity';
import { Services } from 'src/entities/services.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckInOuts,ServiceUsageHistories,Services])],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
