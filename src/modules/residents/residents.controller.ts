import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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
import { ImportCsvDto } from './dto/import-csv.dto';

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
    async getById(@Param('residentId') residentId: number) {
        const result = await this.service.findById(residentId);
        return ApiResponse.ok(result);
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
                            Trần Thị B,0912345678,b@example.com,012345678902,Nữ,1995-05-20,`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.attachment('mau-import-cu-dan.csv');
        res.send(csvContent);
    }

    @Post('import-csv')
    @Permissions('Residents.Create')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        type: ImportCsvDto,
    })
    @UseInterceptors(FileInterceptor('file', multerCsvConfig))
    async importCsv(
        @UploadedFile() file: Express.Multer.File,
        @Req() req:any,
    ) {
        if (!file) {
            throw new BadRequestException('Vui lòng upload file CSV');
        }

        const result = await this.service.importFromCsv(file, req.user.staffId);
        return ApiResponse.ok(result, 'Import cư dân từ CSV thành công');
    }
}


