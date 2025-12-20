import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from 'src/common/response.dto';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { multerConfig } from 'src/common/configs/multer.config';
import { UploadAvatarDto } from './dto/upload-avatar.dto';

@Controller('upload')
export class UploadController {
    constructor(private readonly service: UploadService) { }

    @Post('avatar')
    @ApiConsumes('multipart/form-data')
    @ApiBody({type:UploadAvatarDto})
    @UseInterceptors(FileInterceptor('file',multerConfig))
    async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
        const url = await this.service.saveAvatar(file);
        return ApiResponse.ok(url, "Tải ảnh thành công");
    }
}
