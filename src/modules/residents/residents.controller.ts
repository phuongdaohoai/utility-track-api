import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/modules/auth/guards/permissions.guard';
import { FilterResidentDto } from './dto/filter-resident.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig, multerCsvConfig } from 'src/common/configs/multer.config';
import { CreateResidentDto } from './dto/create-resident.dto';
import { ApiResponse } from 'src/common/response.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import type { Response, Express } from 'express';
import { ImportResidentsDto } from './dto/import-csv.dto';

@Controller('residents')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResidentsController {
    constructor(private service: ResidentsService) { }

    @Get('getAll')
    @Permissions('Residents.View')
    async getAll(@Query() query: FilterResidentDto) {
        const result = await this.service.findAll(query);
        return result;
    }

    @Post('create')
    @Permissions('Residents.Create')
    async create(
        @Body() dto: CreateResidentDto,
        @Req() req
    ) {
        const result = await this.service.create(dto, req.user.staffId);
        return ApiResponse.ok(result, "Tạo cư dân thành công");
    }

    @Get('getById/:residentId')
    @Permissions('Residents.View')
    async getById(
        @Param('residentId', ParseIntPipe) residentId: number
    ) {
        return ApiResponse.ok(
            await this.service.findById(+residentId)
        );
    }


    @Put('update/:residentId')
    @Permissions('Residents.Update')
    async update(
        @Param('residentId') residentId: number,
        @Body() dto: UpdateResidentDto,
        @Req() req
    ) {
        const result = await this.service.update(residentId, dto, req.user.staffId);
        return ApiResponse.ok(result, "Cập nhật cư dân thành công");
    }

    @Delete('delete/:residentId')
    @Permissions('Residents.Delete')
    async delete(@Param('residentId') residentId: number, @Req() req) {
        const result = await this.service.remove(residentId, req.user.staffId);
        return ApiResponse.ok(result, "Xóa cư dân thành công");
    }

    @Put('resetQrCode/:residentId')
    @Permissions('Residents.Create')
    async resetQrCode(@Param('residentId') residentId: number) {
        const result = await this.service.resetQrCode(residentId);
        return ApiResponse.ok(result, "Cập nhật mã QR thành công");
    }

    @Get('template-csv')
    async getCsvTemplate(@Res({ passthrough: true }) res: Response) {
        const csvContent = `fullName,phone,email,citizenCard,gender,birthday,apartmentId
                        Nguyễn Văn A,0901234567,a@gmail.com,012345678901,Nam,1990-01-01,5
                        Trần Thị B,0912345678,b@example.com,012345678902,Nữ,1995-05-20,8
                        Lê Văn C,0923456789,,012345678903,Khác,1988-11-10,
                        Phạm Thị D,0934567890,pham.d@example.com,012345678904,Nữ,2000-12-25,12
                        Hoàng Văn E,0945678901,hoang.e@khuc.com,012345678905,Nam,1975-06-15,`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="mau-import-cu-dan.csv"');
        res.send('\uFEFF' + csvContent);
    }

    @Post('import')
    @Permissions('Residents.Create')
    async importResidents(
        @Body() body: ImportResidentsDto,
        @Req() req: any,
    ) {
        const result = await this.service.importResidents(body.residents, req.user.staffId);
        return ApiResponse.ok(result, 'Import cư dân thành công');
    }
}


