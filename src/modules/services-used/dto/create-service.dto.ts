import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateServiceDto {
    @IsNotEmpty()
    @IsString()
    serviceName: string;

    @IsNumber()
    @Max(300)
    @Min(1)
    capacity: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @Min(0)
    @Max(10000000)
    price: number;

    @IsNumber()
    @Min(0)
    @Max(1)
    @IsOptional()
    @ApiProperty({ example: 1, description: "Trạng thái (1: Hoạt động, 0: Không hoạt động)", required: false })
    status?: number;
}
