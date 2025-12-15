import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { ApiResponse } from 'src/common/response.dto';

@Controller('dashboard')
export class DashboardController {
    constructor(private service: DashboardService) { }
    @Get('getDashboardData')
    async getDashboardData(@Query() query: DashboardQueryDto) {
        const result = await this.service.getDashboardData(query.groupBy);
        return ApiResponse.ok(result,"Lấy dữ liệu thành công");
    }

}
