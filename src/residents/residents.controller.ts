import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Controller('residents')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard,PermissionsGuard)
export class ResidentsController {
    constructor(private service:ResidentsService){}
    @Get()
    @Permissions('Residents.View')
    getAll(){
        return this.service.findAll();
    }

    @Post()
    @Permissions('Residents.Create')
    create(@Body() body){
        console.log(body);
        return this.service.create(body);
    }
}
