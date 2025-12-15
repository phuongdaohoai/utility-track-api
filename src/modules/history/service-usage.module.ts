import { ServiceUsageController } from "./service-usage.controller";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm"
import ServiceUsageService from "./service-usage.service";
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";

@Module({
    imports: [TypeOrmModule.forFeature([ServiceUsageHistories])],
    controllers: [ServiceUsageController],
    providers: [ServiceUsageService],   
})
export class ServiceUsageModule {}