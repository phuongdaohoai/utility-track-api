import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class FilterServiceDto {
    @ApiProperty({required:false})
    @IsOptional()
    @IsString()
    search?: string;            

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    status?: number;           

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minPrice?: number;        

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxPrice?: number;          

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;              

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    pageSize?: number;          
}
