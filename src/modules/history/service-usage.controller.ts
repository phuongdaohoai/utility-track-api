import { Get, Controller, Query, UseGuards, ParseIntPipe, NotFoundException, Param } from "@nestjs/common";
import ServiceUsageService from "./service-usage.service";
import { FillerHistoryDto } from "./dto/filter-history.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/modules/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/modules/auth/guards/permissions.guard";
import { permission } from "process";
import { Permissions } from "src/modules/auth/decorators/permissions.decorator";
import { ApiResponse } from "../../common/response.dto";

@Controller("history_checkin")
@ApiBearerAuth("Authorization")
@UseGuards(JwtAuthGuard, PermissionsGuard)

export class ServiceUsageController {
    constructor(
        private readonly serviceUsageService: ServiceUsageService,
    ) { }
    @Get()
    @Permissions("Overview.View")
    async getAll(@Query() filter: FillerHistoryDto) {
        const result = await this.serviceUsageService.getHistory(filter);
        return ApiResponse.ok(result);
    }
    @Get(':id')
    async getDetail(@Param('id', ParseIntPipe) id: number) {
        const data = await this.serviceUsageService.getDetail(id);
        return ApiResponse.ok(data, "Lấy chi tiết thành công");
    }

}