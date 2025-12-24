import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ImportStaffItemDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Tên nhân sự không được để trống' })
    @IsString()
    fullName: string;               

    @ApiProperty()
    @IsOptional()
    @IsString() 
    email: string;

    @ApiProperty()
    @IsString()
    phone: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Role ID không được để trống' })
    roleId: number;                

    @ApiProperty()
    @IsOptional()
    @IsString()
    password?: string;             
}

export class ImportStaffDto {
    @ApiProperty({type: [ImportStaffItemDto]})
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportStaffItemDto)
    staffs: ImportStaffItemDto[];
}