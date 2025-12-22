import {
    IsArray,
    IsDateString,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Matches,
    ValidateNested,
} from "class-validator";
import { GenderEnum } from "./create-resident.dto";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class ImportResidentItemDto {
    @ApiProperty({
        example: "Nguyễn Văn A",
        description: "Họ và tên đầy đủ",
    })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({
        example: "0901234567",
        description: "Số điện thoại Việt Nam (bắt đầu bằng 0, 10 số)",
    })
    @IsPhoneNumber("VN")
    phone: string;

    @ApiProperty({
        example: "a@example.com",
        required: false,
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        example: "012345678901",
        description: "CCCD đúng 12 chữ số",
    })
    @Matches(/^\d{12}$/)
    citizenCard: string;

    @ApiProperty({
        enum: GenderEnum,
        example: GenderEnum.Male,
    })
    @IsEnum(GenderEnum)
    gender: GenderEnum;

    @ApiProperty({
        example: "1990-01-15",
        description: "Ngày sinh định dạng YYYY-MM-DD",
    })
    @IsDateString()
    birthday: string;

    @ApiProperty({
        example: 5,
        required: false,
        description: "ID căn hộ (nếu có)",
    })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    apartmentId?: number;
}

export class ImportResidentsDto {
    @ApiProperty({
        type: [ImportResidentItemDto],
        example: [
            {
                fullName: "Nguyễn Văn A",
                phone: "0901234567",
                email: "a@example.com",
                citizenCard: "012345678901",
                gender: GenderEnum.Male,
                birthday: "1990-01-15",
                apartmentId: 5,
            },
            {
                fullName: "Trần Thị B",
                phone: "0912345678",
                citizenCard: "012345678902",
                gender: GenderEnum.Female,
                birthday: "1995-05-20",
            },
            {
                fullName: "Lê Văn C",
                phone: "0923456789",
                citizenCard: "012345678903",
                gender: GenderEnum.Other,
                birthday: "1988-11-10",
                apartmentId: 10,
            },
        ],
        description: "Danh sách cư dân cần import (tối thiểu các trường bắt buộc)",
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportResidentItemDto)
    residents: ImportResidentItemDto[];
}