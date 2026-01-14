import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class PartialCheckoutDto{
    // @ApiProperty({
    //     description: 'ID của lượt check-in cần check-out một phần',
    //     example: 1
    // })
    // @IsNotEmpty({ message: 'Vui lòng cung cấp ID lượt check-in' })
    // @IsNumber({}, { message: 'ID lượt check-in phải là số' })
    // checkinId: number;

    @ApiProperty({
       description: 'Danh sách vị trí (index) của khách bổ sung cần check-out (trong mảng additionalGuests)',
        type: [Number],
        example: [0, 2]
    })
   @IsArray({ message: 'Danh sách vị trí phải là một mảng' })
    @IsNumber({}, { each: true, message: 'Vị trí (index) phải là số' })
    @Min(0, { each: true, message: 'Vị trí (index) không được nhỏ hơn 0' })
    guestsToCheckout: number[];

}
