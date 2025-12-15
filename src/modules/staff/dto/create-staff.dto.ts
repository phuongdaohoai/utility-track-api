// dto/create-staff.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsUrl,
    Length
} from 'class-validator';

export class CreateStaffDto {
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


    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Ảnh đại diện nhân viên (jpg, png, webp, gif - tối đa 5MB)',
    })
    @IsOptional()
    @IsUrl({}, { message: 'Avatar phải là link hợp lệ' })
    avatar?: string;

    @ApiProperty({ example: 3, description: 'Vai trò: 1=Admin, 2=Quản lý, 3=Lễ tân, 4=Bảo vệ...' })
    @IsNotEmpty({ message: 'Vui lòng chọn vai trò' })
    @IsNumber()
    @Type(() => Number)
    roleId: number;
}