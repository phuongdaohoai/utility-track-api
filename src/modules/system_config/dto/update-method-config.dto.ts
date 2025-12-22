import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateMethodConfigDto {
    @ApiProperty({ example: '1', description: 'Trang thai(1=Active,0InActive)' })
    @IsNotEmpty()
    @IsString()
    value: string;

    @ApiProperty({ example: 'Cổng số 1 đang bảo trì', description: 'Mô tả chi tiết lý do' })
    @IsString()
    @IsOptional()
    description?: string;
}