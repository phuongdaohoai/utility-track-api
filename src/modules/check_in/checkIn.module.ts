import { CheckInService } from "./checkIn.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm"
import { CheckInController } from "./checkIn.controller";
import { Residents } from "src/entities/residents.entity";
import { Services } from "src/entities/services.entity";
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";
import { SystemConfigModule } from '../system_config/system_config.module';
import { StaffAttendances } from "src/entities/staff-attendances.entity";
import { Staffs } from "src/entities/staffs.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Services, Residents, ServiceUsageHistories, StaffAttendances, Staffs]),
        SystemConfigModule
    ],
    controllers: [CheckInController],
    providers: [CheckInService],
})
export class checkInModule { }