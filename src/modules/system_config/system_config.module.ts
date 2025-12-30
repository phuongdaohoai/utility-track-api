import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SystemService } from "../system_config/system_config.service"
import { SystemConfigs } from "src/entities/system-configs.entity"
import { SystemConfigController } from "../system_config/system_config.controller"

@Module({
    imports: [TypeOrmModule.forFeature([SystemConfigs])],
    controllers: [SystemConfigController],
    providers: [SystemService],
    exports: [SystemService]
})
export class SystemConfigModule { }