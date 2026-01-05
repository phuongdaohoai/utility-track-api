import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ServicesUsedService } from './services-used.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/modules/auth/guards/permissions.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { permission } from 'process';
import { FilterServiceDto } from './dto/filter-service.dto';
import { ApiResponse } from 'src/common/response.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import request from 'supertest';

@Controller('services-used')
// @ApiBearerAuth('Authorization')
// @UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServicesUsedController {
    constructor(
        private service: ServicesUsedService
    ) { }

    @Get('getAll')
    // @Permissions('Services.View')
    async getAll(@Query() query: FilterServiceDto) {
        const result = await this.service.findAll(query);
        return ApiResponse.ok(result);
    }

    @Get('getById/:id')
    @Permissions('Services.View')
    async getById(@Param('id') id: number) {
        const result= await this.service.findById(id);
        return ApiResponse.ok(result);
    }

    @Post('create')
    @Permissions('Services.Create')
    async create(@Body() dto: CreateServiceDto, @Req() req) {
        const result = await this.service.create(dto, req.user.staffId);
        return ApiResponse.ok(result, "Thêm Dịch Vụ Thành Công");
    }

    @Put('update/:id')
    @Permissions('Services.Update')
    async update(@Body() dto: UpdateServiceDto, @Req() req, @Param('id') id: number) {
        const result = await this.service.update(id, dto, req.user.staffId);
        return ApiResponse.ok(result);
    }

    @Delete('delete/:id')
    @Permissions('Services.Delete')
    async delete(@Req() req, @Param('id') id: number) {
        const result = await this.service.remove(id, req.user.staffId);
        return ApiResponse.ok(result, "Xóa Dịch Vụ Thành Công");
    }
}


