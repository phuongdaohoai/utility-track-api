import { ApiProperty } from '@nestjs/swagger';
import { IsOptional,IsNumber} from 'class-validator';

export class StaffCheckInDto {
   
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    id?: number;

}