import { IsString, IsOptional, IsNotEmpty, IsNumber, IsPhoneNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer"; 

export class CreateCheckInDto {
    @ApiProperty({
        required: true,
        description: 'Tên khách vãng lai (Bắt buộc)',
        example: 'Nguyễn Văn Khách'
    })
    @IsNotEmpty({ message: 'Vui lòng nhập tên khách' })
    @IsString()
    guestName: string;


    @ApiProperty({
        required: false,
        description: 'Số điện thoại khách',
        example: '0979123456'
    })
    @IsOptional()
    @IsString()
    @IsPhoneNumber('VN', { message: 'Số điện thoại không đúng định dạng Việt Nam!' })
    guestPhone?: string;


    // 3. Dịch vụ
    @ApiProperty({
        description: 'ID dịch vụ (1: Hồ bơi, 2: Gym...)',
        example: 1
    })
    @IsNotEmpty({ message: 'Vui lòng chọn dịch vụ' })
    @Type(() => Number)
    @IsNumber({}, { message: 'ID dịch vụ phải là số' })
    serviceId: number;
}