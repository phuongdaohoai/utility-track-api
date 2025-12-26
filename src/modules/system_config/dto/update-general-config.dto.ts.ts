import { IsNotEmpty, IsString, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateGeneralConfigDto {
    @ApiProperty({
        example: 'OPERATION_HOURS',
        description: 'Key cấu hình muốn sửa'
    })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({
        example: '7:00-22:00',
        description: 'Giá trị lưu dựa theo Key: OPERATION_HOURS: 7:00-22:00 / SYSTEM_STATUS: active(1)-inactive(0)'
    })
    @IsString()
    @IsNotEmpty()
    value: string;
}