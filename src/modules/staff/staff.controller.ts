import { Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { StaffService } from './staff.service';
import { ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/modules/auth/guards/permissions.guard';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { FilterStaffDto } from './dto/filter-staff.dto';
import { ApiResponse } from 'src/common/response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/common/configs/multer.config';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

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
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('avatar', multerConfig))
    create(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreateStaffDto,
        @Req() req) {
        return this.service.create(dto, file, req.user.staffId);
    }

    @Get('getById/:staffId')
    @Permissions('Staff.View')
    getById(
        @Param('staffId') staffId: number,
        @Req() req) {
        return this.service.findById(+staffId);
    }

    @Post('update/:staffId')
    @Permissions('Staff.Update')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('avatar', multerConfig))
    update(
        @Param('staffId') staffId: number,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UpdateStaffDto,
        @Req() req) {
        return this.service.update(+staffId, dto, file, req.user.staffId);
    }

    @Delete('delete/:staffId')
    @Permissions('Staff.Delete')
    delete(
        @Param('staffId') staffId: number,
        @Req() req) {
        return this.service.remove(+staffId, req.user.staffId);
    }
}
