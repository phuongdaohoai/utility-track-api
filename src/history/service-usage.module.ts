import { ServiceUsageController } from "./service-usage.controller";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServiceUsageHistory } from "src/entities/entities/service-usage-history.entity";
import ServiceUsageService from "./service-usage.service";

@Module({
    imports: [TypeOrmModule.forFeature([ServiceUsageHistory])],
    controllers: [ServiceUsageController],
    providers: [ServiceUsageService],   
})
export class ServiceUsageModule {}