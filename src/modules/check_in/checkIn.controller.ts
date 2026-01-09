import { Body, Controller, Post, UseGuards, Req, Get, Query, Param } from '@nestjs/common';
import { CheckInService } from './checkIn.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { ApiResponse } from "../../common/response.dto";
import { ResidentCheckInDto } from './dto/resident-check-in.dto';
import { FindResidentDto } from './dto/find-resident.dto';
import { ApiBody } from '@nestjs/swagger';
import { FilterCheckinDto } from './dto/filter-checkin.dto';
import { PartialCheckoutDto } from './dto/partial-check-out.dto';
import { StaffCheckInDto } from './dto/staff-check-in.dto';
import { FindStaffDto } from './dto/find-staff.dto';


@Controller('check-in')
export class CheckInController {
    constructor(private readonly checkInService: CheckInService) {
    }
    @Get('current-check-ins')
    async getCurrentCheckIns(@Query() filter: FilterCheckinDto) {
        const result = await this.checkInService.getCurrentCheckIns(filter);
        return ApiResponse.ok(result);
    }

    @Get('get-all-check-ins')
    async getAllCurrentCheckIns() {
        const result = await this.checkInService.getAllCurrentCheckIns();
        return ApiResponse.ok(result);
    }


    @Get('get-all-check-ins-staff')
    async getCurrentCheckInsStaff(@Query() filter: FilterCheckinDto) {
        const result = await this.checkInService.getCurrentCheckInsStaff(filter);
        return ApiResponse.ok(result);
    }

    @Post('current-check-outs/:checkinId')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                checkinId: {
                    type: 'number',
                    example: 1035,
                },
            },
            required: ['checkinId'],
        },
    })
    async currentCheckOuts(@Body('checkinId') checkinId: number) {
        const result = await this.checkInService.currentCheckOuts(checkinId);
        return ApiResponse.ok(result, "Check-out thành công!");
    }

    @Post('partial-check-out/:checkinId')
    async partialCheckout(
        @Param('checkinId') checkinId: number,
        @Body() dto: PartialCheckoutDto
    ) {
        const result = await this.checkInService.partialCheckout(
            Number(checkinId),
            dto
        );
        return ApiResponse.ok(result, 'Check-out thành công!');
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

    @Post('staff-check-in')
    async staffCheckIn(@Body() dto: StaffCheckInDto) {
        const result = await this.checkInService.staffCheckInOrOut(dto);
        return ApiResponse.ok(result);
    }

    @Post('find-staff')
    async findStaff(@Body() dto: FindStaffDto) {
        const result = await this.checkInService.findStaff(dto);
        return ApiResponse.ok(result);
    }
}
