import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString} from 'class-validator';

export class StaffCheckInDto {
   
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    qrCode?: string;

}