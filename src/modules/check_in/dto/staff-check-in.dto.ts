import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsArray, IsNumber } from 'class-validator';

export class StaffCheckInDto {
   
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    qrCode?: string;

    @ApiProperty({ required: false, type: [Number] })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    faceDescriptor?: number[];
    
}