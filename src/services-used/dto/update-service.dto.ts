import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, isNumber, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateServiceDto {
    @ApiProperty({ example: "Massage Foot", description: "Tên dịch vụ" })
    @IsNotEmpty()
    @IsString()
    serviceName: string;

    @ApiProperty({ example: 10, description: "Số lượng khách tối đa", minimum: 1, maximum: 300 })
    @IsNumber()
    @Max(300)
    @Min(1)
    capacity: number;

    @ApiProperty({ example: "Dịch vụ massage chân thư giãn", required: false })
    @IsOptional()
    @IsString()
    description?: string;


    @ApiProperty({ example: 200000, description: "Giá dịch vụ", minimum: 0, maximum: 10000000 })
    @IsNumber()
    @Min(0)
    @Max(10000000)
    price: number;

    @ApiProperty({ example: 1, description: "Trạng thái", minimum: 0, maximum: 1 })
    @IsNumber()
    @Min(0)
    @Max(1)
    status: number;

    @ApiProperty({
        example: "2025-04-05T10:30:45.123Z",
        description: "Thời gian updatedAt hiện tại mà client đang thấy. Dùng để tránh xung đột chỉnh sửa"
    })
    @IsNotEmpty({ message: "updatedAt là bắt buộc khi cập nhật" })
    @IsDateString()
    updatedAt: string | Date;

}
