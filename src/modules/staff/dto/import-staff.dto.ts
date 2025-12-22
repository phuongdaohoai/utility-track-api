import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImportStaffItemDto {
    @IsNotEmpty({ message: 'Tên nhân sự không được để trống' })
    @IsString()
    fullName: string;               

    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsNotEmpty({ message: 'Role ID không được để trống' })
    roleId: number;                

    @IsOptional()
    @IsString()
    password?: string;             
}

export class ImportStaffDto {
    staffs: ImportStaffItemDto[];
}