import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { StaffService } from './staff.service';
import { ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/modules/auth/guards/permissions.guard';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { FilterStaffDto } from './dto/filter-staff.dto';
import { ApiResponse } from 'src/common/response.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ImportStaffDto } from './dto/import-staff.dto';
import type { Response } from 'express';
@Controller('staff')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffController {

    constructor(private service: StaffService) { }

    @Get('getAll')
    @Permissions('Staff.View')
    async getAll(@Query() query: FilterStaffDto) {
        const result = await this.service.findAll(query);
        return ApiResponse.ok(result);
    }

    @Post('create')
    @Permissions('Staff.Create')
    async create(
        @Body() dto: CreateStaffDto,
        @Req() req) {
        const result= await this.service.create(dto, req.user.staffId);
        return ApiResponse.ok(result, "Thêm nhân viên thành công");
    }

    @Get('getById/:staffId')
    @Permissions('Staff.View')
    async getById(
        @Param('staffId') staffId: number,
        @Req() req) {
        const result= await this.service.findById(+staffId);
        return ApiResponse.ok(result);
    }

    @Put('update/:staffId')
    @Permissions('Staff.Update')
    async update(
        @Param('staffId') staffId: number,
        @Body() dto: UpdateStaffDto,
        @Req() req) {
        const result=await this.service.update(+staffId, dto, req.user.staffId);
        return ApiResponse.ok(result,"Cập nhật nhân viên thành công");
    }

    @Delete('delete/:staffId')
    @Permissions('Staff.Delete')
    async delete(
        @Param('staffId') staffId: number,
        @Req() req) {
        const result=await this.service.remove(+staffId, req.user.staffId);
        return ApiResponse.ok(result,"Xóa nhân viên thành công");
    }

    @Post('import')
    @Permissions('Staff.Create')
    async importStaff(
        @Body() body: ImportStaffDto,
        @Req() req: any,
    ) {
        const result = await this.service.importStaffs(body.staffs, req.user.staffId);
        return ApiResponse.ok(result, 'Import nhân sự thành công');
    }

    @Get('template-csv')
    async getStaffCsvTemplate(@Res({ passthrough: true }) res: Response) {
        const csvContent = `fullName,email,phone,roleId,password
                        Nguyễn Văn Quản Lý,quanly@company.com,0901234567,1,
                        Trần Bảo Vệ,baove@company.com,0912345678,3,Matkhau123
                        Lê Kỹ Thuật,kythuat@company.com,0923456789,4,`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="mau-import-nhan-su.csv"');
        res.send('\uFEFF' + csvContent);
    }
}
