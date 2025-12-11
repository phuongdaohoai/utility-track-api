import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@Controller('staff')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard,PermissionsGuard)
export class StaffController {

    constructor(private service: StaffService) { }

    @Get()
    @Permissions('Staff.View')
    getAll() {
        return this.service.findAll();
    }

    @Post()
    @Permissions('Staff.Create')
    create(@Body() body) {
        console.log(body);
        return this.service.create(body);
    }
}
