import { ApiProperty } from "@nestjs/swagger";
import { IsString, isString } from "class-validator";

export class DashboardQueryDto {
    @ApiProperty({ required: true })
    @IsString()
    groupBy: 'year' | 'month' | 'day';

}