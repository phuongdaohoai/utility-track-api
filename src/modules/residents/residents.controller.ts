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
import { RegisterFaceDto } from './dto/resgister-face.dto';

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
    async getCsvTemplate(@Res() res: Response) {
        // 1. Thiết lập Header để trình duyệt hiểu là file ZIP tải về
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="huong-dan-import.zip"');

        // 2. Gọi service để lấy luồng dữ liệu ZIP
        const archive = await this.service.generateTemplateZip();

        // 3. Pipe (bơm) dữ liệu từ archiver trực tiếp vào Response của Express
        archive.pipe(res);

        // 4. Kết thúc quá trình đóng gói
        await archive.finalize();
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

    @Post('register-face-id')
    @Permissions('Residents.Update')
    async registerFaceId(
        @Body() dto: RegisterFaceDto,
    ) {
        const result = await this.service.registerFaceId(dto);
        return ApiResponse.ok(result, "Đăng ký Face ID thành công");
    }
}


