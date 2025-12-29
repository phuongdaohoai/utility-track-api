import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { DashboardGroupBy } from '../enum/dashboard-group-by.enum';

export class DashboardQueryDto {

    @ApiPropertyOptional({
        enum: DashboardGroupBy,
        example: DashboardGroupBy.MONTH,
    })
    @IsEnum(DashboardGroupBy)
    @IsOptional()
    groupBy?: DashboardGroupBy = DashboardGroupBy.MONTH;

    @ApiPropertyOptional({
        example: '2025-01-01',
        description: 'Ngày bắt đầu',
    })
    @IsDateString()
    @IsOptional()
    fromDate?: string;

    @ApiPropertyOptional({
        example: '2025-12-31',
        description: 'Ngày kết thúc',
    })
    @IsDateString()
    @IsOptional()
    toDate?: string;
}
