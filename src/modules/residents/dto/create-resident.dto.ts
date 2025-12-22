// dto/create-resident.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsUrl,
    Length,
    Matches,
} from 'class-validator';

export enum GenderEnum {
    Male = 'Nam',
    Female = 'Nữ',
    Other = 'Khác',
}

export class CreateResidentDto {

    @ApiProperty({ example: 'Nguyễn Thị Hương' })
    @IsNotEmpty({ message: 'Họ tên không được để trống' })
    @IsString()
    @Length(2, 100)
    fullName: string;

    @ApiProperty({ example: '0901234567' })
    @IsNotEmpty()
    @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
    phone: string;

    @ApiProperty({ example: 'huong.nt@khuc.com', required: false })
    @IsOptional()
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email?: string;

    @ApiProperty({ example: '097387928104', description: 'CCCD 12 số' })
    @IsNotEmpty()
    @Matches(/^\d{12}$/, { message: 'CCCD phải 12 chữ số' })
    citizenCard: string;

    @ApiProperty({ enum: GenderEnum })
    @IsEnum(GenderEnum, { message: 'Giới tính không hợp lệ' })
    gender: GenderEnum;

    @ApiProperty({ example: '2000-05-12' })
    @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
    birthday: string;

    @ApiProperty({ example: 3, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    apartmentId?: number;

    @ApiProperty({ example: 'QR_RESIDENT_001', required: false })
    @IsOptional()
    @IsString()
    qrCode?: string;

    @ApiProperty({ example: 'base64-string', required: false })
    @IsOptional()
    @IsString()
    faceIdData?: string;

  
    @ApiProperty({
        type: 'string',
        format: 'binary',
        required: false,
    })
    @IsOptional()
    @IsString()
    avatar?: any;
}
