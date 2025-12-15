import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/modules/auth/guards/permissions.guard';
import { FilterResidentDto } from './dto/filter-resident.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/common/configs/multer.config';
import { CreateResidentDto } from './dto/create-resident.dto';
import { ApiResponse } from 'src/common/response.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { Residents } from 'src/entities/residents.entity';

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
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('avatar', multerConfig))
    async create(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreateResidentDto,
        @Req() req
    ) {
        const result = await this.service.create(dto, file, req.user.staffId);
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
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('avatar', multerConfig))
    async update(
        @Param('residentId') residentId: number,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UpdateResidentDto,
        @Req() req
    ) {
        const result = await this.service.update(residentId, dto, file, req.user.staffId);
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

    // Comming soon :vvv
    // @Post('registerFaceId/:id')
    // @Permissions('Residents.Create')
    // async registerFaceId(@Param('id') id: number, @Body('faceIdData') faceIdData: Buffer): Promise<Residents> {
    //     const result = await this.service.registerFaceId(id, faceIdData);
    //     return ApiResponse.ok(result, "Cập nhật mã QR thành công");
    // }

    // async unregisterFaceId(@Param('id') id: number): Promise<void> {
    //     const result = await this.service.unregisterFaceId(id);
    //     return ApiResponse.ok(result, "Cập nhật mã QR thành công");
    // }
}

