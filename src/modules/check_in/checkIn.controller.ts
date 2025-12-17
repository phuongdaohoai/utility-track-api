import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { CheckInService } from './checkIn.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { CreateCheckInAuTo } from './dto/check-in-auto.dto';
import { ApiResponse } from "../../common/response.dto";


@Controller('check-in')
export class CheckInController {
    constructor(private readonly checkInService: CheckInService) {
    }

    @Post('manual')
    async manualCheckIn(@Body() data: CreateCheckInDto, @Req() req: any) {
        const staffId = req.user?.id || 1;
        const result = await this.checkInService.createCheckIn(data, staffId);
        ApiResponse.ok(result, "Check-in thành công!");
    }

    @Post('auto')
    async autoCheckIn(@Body() data: CreateCheckInAuTo, @Req() req: any) {
        const staffId = req.user?.id || 1;
        const result = await this.checkInService.autoCheckIn(data, staffId);
        return ApiResponse.ok(result, "Check-in thành công!");
    }
}