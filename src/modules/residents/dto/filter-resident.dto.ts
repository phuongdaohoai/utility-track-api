import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class FilterResidentDto {
    @ApiProperty({required:false})
    @IsOptional()
    @IsString()
    search?: string;                  

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
    
    @ApiProperty({ 
        required: false, 
        description: 'JSON string chứa mảng các điều kiện lọc: [{field, operator, value}, ...]' 
    })
    @IsOptional()
    filters?: string;
}
