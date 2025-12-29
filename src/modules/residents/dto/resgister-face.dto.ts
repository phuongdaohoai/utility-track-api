import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber } from "class-validator";

export class RegisterFaceDto {
    @ApiProperty()
    @IsInt()
    residentId: number;

    @ApiProperty({ type: [Number], description: 'Mảng mô tả khuôn mặt với độ dài 128' })
    @IsArray()
    @ArrayMinSize(128)
    @ArrayMaxSize(128)
    @IsNumber({}, { each: true })
    faceDescriptor: number[];
}