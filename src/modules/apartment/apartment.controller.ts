import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApartmentService } from './apartment.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponse } from 'src/common/response.dto';

@Controller('apartment')
export class ApartmentController {
    constructor(
        private service: ApartmentService
    ) {}

    @Get('getAll')
    async getAll() {
        const result = await this.service.findAll();
        return ApiResponse.ok(result, "Lấy danh sách thành công");
    }

    @Get('by-ids')
    async getByIds(@Query('ids') ids: string) {
        if (!ids) {
            return [];
        }
        const idArray = ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
        return this.service.findByIds(idArray);
    }
}
