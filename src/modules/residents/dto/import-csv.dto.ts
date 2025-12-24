// src/modules/residents/dto/import-csv.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ImportResidentItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty()
    @IsString() 
    phone: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString() 
    email?: string;

    @ApiProperty()
    @IsString() 
    citizenCard: string;

    @ApiProperty()
    @IsString()
    gender: string;

    @ApiProperty()
    @IsString() 
    birthday: string;

    @ApiProperty({ required: false })
    @IsOptional()
    apartmentId?: any;
}

export class ImportResidentsDto {
    @ApiProperty({ type: [ImportResidentItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportResidentItemDto)
    residents: ImportResidentItemDto[];
}