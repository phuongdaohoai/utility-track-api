import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { ApiResponse } from 'src/common/response.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('dashboard')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
    constructor(private service: DashboardService) { }
    @Get('getDashboardData')
    async getDashboardData(@Query() query: DashboardQueryDto) {
        const result = await this.service.getDashboardData(query.groupBy);
        return ApiResponse.ok(result,"Lấy dữ liệu thành công");
    }

}
