import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';

export class FindStaffDto {
                  
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    qrCode?: string;                       

}