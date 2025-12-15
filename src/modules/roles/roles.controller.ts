import { Controller, Get } from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiResponse } from 'src/common/response.dto';

@Controller('roles')
export class RolesController {
    constructor(private service:RolesService){}

    @Get('getAll')
    async getAll(){
        const result = await this.service.findAll();
        return ApiResponse.ok(result);
    }
}
