import { Get, Controller, Query, UseGuards, ParseIntPipe, NotFoundException, Param } from "@nestjs/common";
import ServiceUsageService from "./service-usage.service";
import { FillerHistoryDto } from "./dto/filter-history.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { permission } from "process";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { ApiResponse } from "../common/response.dto";

@Controller("history_checkin")
// @ApiBearerAuth("Authorization")
// @UseGuards(JwtAuthGuard, PermissionsGuard)

export class ServiceUsageController {
    constructor(
        private readonly serviceUsageService: ServiceUsageService,
    ) { }
    @Get()
    // @Permissions("Overview.View")
    async getAll(@Query() filter: FillerHistoryDto) {
        try {
            const result = await this.serviceUsageService.getHistory(filter);
            return ApiResponse.ok(result);
        } catch (error) {
            return ApiResponse.fail("Lỗi hệ thống, vui lòng thử lại sau");
        }
    }
    @Get(':id')
    async getDetail(@Param('id', ParseIntPipe) id: number) {
        try {
            const data = await this.serviceUsageService.getDetail(id);
            return ApiResponse.ok(data, "Lấy chi tiết thành công!");
        } catch (error) {
            if (error.status === 404 || error instanceof NotFoundException) {
                return ApiResponse.fail(`Không tìm thấy cư dân nào có ID là ${id}`);
            }
            console.error("Lỗi crash server:", error);
            return ApiResponse.fail("Lỗi hệ thống, vui lòng thử lại sau");
        }
    }

}