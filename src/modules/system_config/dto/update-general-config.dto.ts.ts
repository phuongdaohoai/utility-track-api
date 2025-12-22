import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateGeneralConfigDto {
    @ApiProperty({ example: 'METHOD_FACEID', description: 'Key cấu hình muốn sửa' })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({ example: '0', description: 'Giá trị mới (Lưu ý gửi dạng chuỗi "1" hoặc "0")' })
    @IsString()
    @IsNotEmpty()
    values: string;
}