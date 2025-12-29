import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateMethodConfigDto {
    @ApiProperty({ example: '1', description: 'Trang thai(1=Active,0InActive)' })
    @IsNotEmpty()
    @IsString()
    @IsIn(['0', '1'], { message: "Giá trị chỉ nhân 1 or 0" })
    status: string;

    @ApiProperty({ example: 'Cổng số 1 đang bảo trì', description: 'Mô tả chi tiết lý do' })
    @IsString()
    @IsOptional()
    description?: string;
}