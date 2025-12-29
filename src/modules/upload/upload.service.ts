import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { ERROR_CODE } from 'src/common/constants/error-code.constant';

@Injectable()
export class UploadService {
    saveAvatar(file: Express.Multer.File): string {
        if (!file) {
            throw new BadRequestException({
                errorCode: ERROR_CODE.UPLOAD_INVALID_FILES,
                message: "File không hợp lệ",
            });
        }

        const filename = randomUUID() + extname(file.originalname);
        const dir = join(process.cwd(), 'public', 'avatars');

        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }

        writeFileSync(join(dir, filename), file.buffer);

        return `/avatars/${filename}`;
    }
}
