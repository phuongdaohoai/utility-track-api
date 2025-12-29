import { IsString, IsOptional, ValidateIf, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCheckInDto {
    @ApiProperty({
        required: false,
        description: 'ID của cư dân (Nếu check-in cho cư dân thì nhập cái này, bỏ trống Guest Name)',
        example: 'RES-001'
    })
    @IsOptional()
    @IsString()
    residentId?: string;

    @ApiProperty({
        required: false,
        description: 'Tên khách vãng lai.',
        example: 'Nguyễn Văn Khách'
    })
    @ValidateIf(o => !o.residentId)
    @IsNotEmpty({ message: 'Vui lòng nhập tên khách' })
    @IsString()
    guestName?: string;

    @ApiProperty({
        required: false,
        description: 'Số điện thoại liên hệ của khách',
        example: '0979123456'
    })
    @IsOptional()
    @IsString({ message: 'Số điện thoại không hợp lệ' })
    guestPhone?: string;

    @ApiProperty({
        required: false,
        description: 'Phương thức check-in (Ví dụ: QR_CODE, FACE_ID, MANUAL...)',
        example: 'QR_CODE'
    })
    @IsOptional()
    @IsString()
    checkInMethod?: string;
}