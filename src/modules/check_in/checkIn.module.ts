import { CheckInService } from "./checkIn.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm"
import { CheckInController } from "./checkIn.controller";
import { Residents } from "src/entities/residents.entity";
import { Services } from "src/entities/services.entity";
import { CheckInOuts } from "src/entities/check-in-outs.entity";
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";

@Module({
    imports: [TypeOrmModule.forFeature([CheckInOuts, Residents, ServiceUsageHistories])],
    controllers: [CheckInController],
    providers: [CheckInService],
})
export class checkInModule { }