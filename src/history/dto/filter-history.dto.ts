import { IsOptional, IsString, IsDateString, IsNumberString, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class FillerHistoryDto {
    @IsOptional()
    @IsString({ message: 'Tên tìm kiếm phải là chuỗi kí tự' })
    searchName?: string; // Tim theo cu dan

    @IsOptional()
    @IsString({ message: 'Tên tìm kiếm phải là chuỗi kí tự' })
    serviceId?: string; // Tim theo dich vu

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Trang phải là số nguyên' })
    @Min(1, { message: 'Trang phải lớn hơn hoặc bằng 1' })
    page?: number; // Trang so may

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Giới hạn (limit) phải là số nguyên' })
    @Min(1, { message: 'Limit phải lớn hơn 0' })
    limit?: number;// So ban ghi tren trang

}