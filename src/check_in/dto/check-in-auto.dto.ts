import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckInAuTo {
    @ApiProperty({
        example: 'A11F20C',
        description: 'Mã thẻ từ hoăc QR code'
    })
    @IsNotEmpty({ message: 'Không quét được mã, vui lòng thử lại!' })
    @IsString()
    code: string;

    @ApiProperty({
        example: 1,
        description: 'ID dịch vụ sử dụng (nếu có)'
    })
    @IsOptional()
    @IsNotEmpty({ message: "Lỗi thiết bị:Không quét được dịch vụ" })
    @IsNumber()
    serviceId?: number;

}