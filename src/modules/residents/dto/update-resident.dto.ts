// dto/create-staff.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsUrl,
    Length,
    Min,
    Max,
    IsDateString,
    Matches,
    IsEnum,
} from 'class-validator';
import { GenderEnum } from './create-resident.dto';
import { Type } from 'class-transformer';

export class UpdateResidentDto {
    @ApiProperty({ example: 'Nguyễn Thị Hương', description: 'Họ và tên nhân viên' })
    @IsNotEmpty({ message: 'Họ tên không được để trống' })
    @IsString()
    @Length(2, 100)
    fullName: string;

    @ApiProperty({ example: '0901234567', description: 'Số điện thoại đăng nhập' })
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
    phone: string;

    @ApiProperty({ example: 'huong.nt@khuC.com', description: 'Email' })
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

    @ApiProperty({ example: 1, description: 'Trạng thái: 1 = hoạt động, 0 = khóa', enum: [0, 1] })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Max(1)
    status: number;

    @ApiProperty({
        type: 'string',
        format: 'binary',
        required: false,
    })
    avatar?: any;


    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    version: number;

}