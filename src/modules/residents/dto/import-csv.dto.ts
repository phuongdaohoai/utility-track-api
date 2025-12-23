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
    @IsString() // 🟢 QUAN TRỌNG: Chỉ check chuỗi, không check format SĐT ở đây
    phone: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString() // 🟢 QUAN TRỌNG: Chỉ check chuỗi, không check format Email ở đây
    email?: string;

    @ApiProperty()
    @IsString() // 🟢 QUAN TRỌNG: Bỏ Regex CCCD ở đây
    citizenCard: string;

    @ApiProperty()
    @IsString() // 🟢 QUAN TRỌNG: Để string để nhận cả "Nam", "Nữ", "Male"...
    gender: string;

    @ApiProperty()
    @IsString() // 🟢 QUAN TRỌNG: Bỏ IsDateString để nhận cả "DD/MM/YYYY"
    birthday: string;

    @ApiProperty({ required: false })
    @IsOptional()
    apartmentId?: any; // Để any để tránh lỗi type number/string
}

export class ImportResidentsDto {
    @ApiProperty({ type: [ImportResidentItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportResidentItemDto)
    residents: ImportResidentItemDto[];
}