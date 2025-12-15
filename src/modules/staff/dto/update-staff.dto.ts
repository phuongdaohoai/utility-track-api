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
} from 'class-validator';

export class UpdateStaffDto {
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

    @ApiProperty({ example: 1, description: 'Trạng thái: 1 = hoạt động, 0 = khóa', enum: [0, 1] })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Max(1)
    status: number;

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
    roleId: number;

    @ApiProperty({
        example: "2025-04-05T10:30:45.123Z",
        description: "Thời gian updatedAt hiện tại mà client đang thấy. Dùng để tránh xung đột chỉnh sửa"
    })
    @IsNotEmpty({ message: "updatedAt là bắt buộc khi cập nhật" })
    @IsDateString()
    updatedAt: string | Date;
}