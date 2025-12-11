import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ServicesUsedService } from './services-used.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { permission } from 'process';

@Controller('services-used')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard,PermissionsGuard)
export class ServicesUsedController {
    constructor(
        private service: ServicesUsedService
    ) { }

    @Get()
    @Permissions('Services.View')
    getAll() {
        return this.service.findAll();
    }

    @Post()
    @Permissions('Services.Create')
    create(@Body() body) {
        console.log(body);
        return this.service.create(body);
    }
}
