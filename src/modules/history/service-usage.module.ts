import { ServiceUsageController } from "./service-usage.controller";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm"
import ServiceUsageService from "./service-usage.service";
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";
import { Residents } from "src/entities/residents.entity";
import { CheckInOuts } from "src/entities/check-in-outs.entity";

@Module({
    imports: [TypeOrmModule.forFeature([ServiceUsageHistories, Residents, CheckInOuts])],
    controllers: [ServiceUsageController],
    providers: [ServiceUsageService],   
})
export class ServiceUsageModule {}