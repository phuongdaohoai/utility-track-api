import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class PartialCheckoutDto{
    // @ApiProperty({
    //     description: 'ID của lượt check-in cần check-out một phần',
    //     example: 1
    // })
    // @IsNotEmpty({ message: 'Vui lòng cung cấp ID lượt check-in' })
    // @IsNumber({}, { message: 'ID lượt check-in phải là số' })
    // checkinId: number;

    @ApiProperty({
        description: 'Danh sách khách bổ sung sẽ được check-out',
        type: [String],
        example: ['Khách 1', 'Khách 2']
    })
    @IsArray({ message: 'Danh sách khách check-out phải là một mảng' })
    @IsString({ each: true, message: 'Tên khách phải là chuỗi' })
    guestsToCheckout: string[];

}
