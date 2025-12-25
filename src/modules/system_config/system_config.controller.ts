import { Get, Put, Controller, Query, UseGuards, ParseIntPipe, Param, Body, Delete } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/modules/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/modules/auth/guards/permissions.guard";
import { Permissions } from "src/modules/auth/decorators/permissions.decorator";
import { ApiResponse } from "../../common/response.dto";
import { ERROR_CODE } from "src/common/constants/error-code.constant";
import { SystemService } from '../system_config/system_config.service'
import { UpdateGeneralConfigDto } from '../system_config/dto/update-general-config.dto.ts'
import { UpdateMethodConfigDto } from '../system_config/dto/update-method-config.dto'
import { permission } from "process";

@Controller("system_config")
@ApiBearerAuth("Authorization")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemConfigController {
    constructor(
        private readonly service: SystemService
    ) { }

    //lay danh sach
    @Get()
    async getAll() {
        const data = await this.service.getAll()
        return ApiResponse.ok(data)
    }
    //Cap nhat cau hinh chung
    @Put("general")
    async updateGeneral(@Body() dto: UpdateGeneralConfigDto) {
        const data = await this.service.updateGeneral(dto)
        return ApiResponse.ok(data)
    }

    //Cap nhat method 
    @Put("method/:id")
    async updateMethod(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateMethodConfigDto
    ) {
        const data = await this.service.updateMethod(id, dto)
        return ApiResponse.ok(data)
    }
    

}