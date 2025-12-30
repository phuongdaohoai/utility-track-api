import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsArray, IsNumber } from 'class-validator';

export class ResidentCheckInDto {
    @ApiProperty()
    @IsInt()
    serviceId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    qrCode?: string;

    @ApiProperty({ required: false, type: [Number] })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    faceDescriptor?: number[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    additionalGuests?: string[];
}