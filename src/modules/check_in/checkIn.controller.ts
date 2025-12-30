import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { CheckInService } from './checkIn.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { ApiResponse } from "../../common/response.dto";
import { ResidentCheckInDto } from './dto/resident-check-in.dto';
import { FindResidentDto } from './dto/find-resident.dto';


@Controller('check-in')
export class CheckInController {
    constructor(private readonly checkInService: CheckInService) {
    }

    @Post('guests')
    async manualCheckIn(@Body() data: CreateCheckInDto, @Req() req: any) {
        const staffId = req.user?.id || 1;
        const result = await this.checkInService.createCheckIn(data, staffId);
        return ApiResponse.ok(result, "Check-in thành công!");
    }

    @Post('resident-check-in')
    async residentCheckIn(@Body() dto: ResidentCheckInDto) {
        const result = await this.checkInService.residentCheckInOrOut(dto);
        return ApiResponse.ok(result);
    }
    @Post('find-resident')
    async findResident(@Body() dto: FindResidentDto) {
        const result = await this.checkInService.findResident(dto);
        return ApiResponse.ok(result);
    }
}