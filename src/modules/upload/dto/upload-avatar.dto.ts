import { ApiProperty } from "@nestjs/swagger";

export class UploadAvatarDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Ảnh đại diện nhân viên (jpg, png, webp, gif - tối đa 5MB)',
    })
    file: any;
}