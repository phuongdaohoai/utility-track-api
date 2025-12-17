import { IsString, IsNumber, IsOptional, ValidateIf, IsNotEmpty } from "class-validator";


export class CreateCheckInDto {
    // @IsNotEmpty({ message: 'Vui lòng chọn dịch vụ' })
    // @IsNumber()
    // serviceId: number;

    @IsOptional()
    @IsString()
    residentId?: string;

    @ValidateIf(o => !o.residentId)
    @IsNotEmpty({ message: 'Vui lòng nhập tên khách' })
    @IsString()
    guestName?: string; 

    @IsOptional()
    @IsString({ message: 'Số điện thoại không hợp lệ' })
    guestPhone?: string;

    @IsOptional()
    @IsString()
    checkInMethod?: string;

}