import { IsOptional, IsString, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FillerHistoryDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Tên tìm kiếm phải là chuỗi kí tự' })
    search?: string; // Tim theo cu dan

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Tên tìm kiếm phải là chuỗi kí tự' })
    serviceId?: string; // Tim theo dich vu

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Trang phải là số nguyên' })
    @Min(1, { message: 'Trang phải lớn hơn hoặc bằng 1' })
    page?: number; // Trang so may

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Giới hạn (limit) phải là số nguyên' })
    @Min(1, { message: 'Limit phải lớn hơn 0' })
    limit?: number;// So ban ghi tren trang

    @ApiProperty({ required: false, enum: ['resident', 'guest'] })
    @IsOptional()
    @IsString()
    type?: 'resident' | 'guest';

}