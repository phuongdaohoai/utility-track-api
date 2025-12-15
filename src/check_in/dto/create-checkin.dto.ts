import { IsString, IsNumber, IsOptional, ValidateIf, IsNotEmpty } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckInDto {
    @IsNotEmpty({ message: 'Vui lòng chọn dịch vụ' })
    @IsNumber()
    ServiceId: number;

    @IsOptional()
    @IsString()
    residentId?: string;

    @ValidateIf(o => !o.residentId)
    @IsNotEmpty({ message: 'Vui lòng nhập tên khách' })
    @IsString()
    guestName?: string;

    @IsOptional()
    @IsString()
    guestPhone?: string;

    @IsOptional()
    @IsString()
    checkInMethod?: string;

}