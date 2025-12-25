import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateMethodConfigDto {
    @ApiProperty({ example: '1', description: 'Trang thai(1=Active,0InActive)' })
    @IsNotEmpty()
    @IsString()
    @IsIn(['0', '1'], { message: "Value must be either '0' (Inactive) or '1' (Active)." })
    value: string;

    @ApiProperty({ example: 'Cổng số 1 đang bảo trì', description: 'Mô tả chi tiết lý do' })
    @IsString()
    @IsOptional()
    description?: string;
}