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
}