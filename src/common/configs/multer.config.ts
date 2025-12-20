import { BadRequestException } from "@nestjs/common";
import { memoryStorage } from "multer";
import { extname } from "path";

export const multerConfig = {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const allowedMime = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        const ext = extname(file.originalname).toLowerCase();

        if (
            allowedExt.includes(ext) &&
            allowedMime.includes(file.mimetype)
        ) {
            return cb(null, true);
        }

        return cb(
            new BadRequestException(
                'Chỉ chấp nhận file ảnh: jpg, jpeg, png, gif, webp'
            ),
            false
        );
    },
};


export const multerCsvConfig = {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 
    fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();

        const isCsvExtension = ext === '.csv';
        const isCsvMime = file.mimetype === 'text/csv';
        const isExcelMime = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ].includes(file.mimetype);

        if (isCsvExtension && (isCsvMime || isExcelMime)) {
            return cb(null, true);
        }

        return cb(
            new BadRequestException(
                'Chỉ chấp nhận file định dạng CSV (.csv)'
            ),
            false
        );
    },
};