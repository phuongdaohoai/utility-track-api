import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, isString, MinLength } from "class-validator";

export class LoginDto {
    @ApiProperty()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    qrCode?: string;
}

