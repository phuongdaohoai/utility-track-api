import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Residents } from 'src/entities/residents.entity';
import { Brackets, In, Not, Repository } from 'typeorm';
import { FilterResidentDto } from './dto/filter-resident.dto';
import { PaginationResult } from 'src/common/pagination.dto';
import { CreateResidentDto, GenderEnum } from './dto/create-resident.dto';
import * as crypto from 'crypto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { BASE_STATUS } from 'src/common/constants/base-status.constant';
import { error, log } from 'console';
import { parse } from '@fast-csv/parse';
import { Readable } from 'stream';
import { ImportResidentItemDto } from './dto/import-csv.dto';
import { ERROR_CODE } from 'src/common/constants/error-code.constant';
import { QueryHelper } from 'src/common/helper/query.helper';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import archiver from 'archiver';
import { ApartmentService } from '../apartment/apartment.service';
interface FilterPayload {
    field: string;
    operator: string;
    value?: any;
    from?: any;
    to?: any;
}
@Injectable()
export class ResidentsService {
    constructor
        (
            @InjectRepository(Residents)
            private repo: Repository<Residents>,

            private apartmentService: ApartmentService,
        ) { }
    async findAll(filter: FilterResidentDto) {
        // 1. Dựng QueryBuilder cơ bản (Join bảng)
        const qb = this.repo.createQueryBuilder('resident')
            .leftJoinAndSelect('resident.apartment', 'apartment')
            .where('resident.deletedAt IS NULL'); // Giữ logic chưa xóa mềm

        // 2. Gọi Helper để xử lý phần còn lại
        return await QueryHelper.apply(qb, filter, {
            alias: 'resident',

            // Các trường tìm kiếm chung (Search Box)
            searchFields: [
                'resident.fullName',
                'resident.email',
                'resident.phone',
                'apartment.roomNumber'
            ],

            // Mapping tên từ Frontend -> DB
            fieldMap: {
                'room': 'apartment.roomNumber',
                'joinDate': 'resident.createdAt', // Map joinDate vào createdAt
                'birthday': 'resident.birthday',
                // Map rõ ràng các trường khác để tránh nhầm lẫn
                'fullName': 'resident.fullName',
                'email': 'resident.email',
                'phone': 'resident.phone',
                'status': 'resident.status'
            },

            // 🔥 QUAN TRỌNG: Danh sách các trường cần xử lý logic ngày (00:00 -> 23:59)
            dateFields: ['joinDate', 'birthday', 'createdAt']
        });
    }
    async findById(id: number) {
        const resident = await this.repo.findOne({
            where: {
                id,
            },
            relations: {
                apartment: true,
            },
        });

        if (!resident) {
            throw new NotFoundException({
                errorCode: ERROR_CODE.RESIDENT_NOT_FOUND,
                message: "Không tìm thấy cư dân",
            })
        }
        return resident;
    }

    async create(dto: CreateResidentDto, userId: number) {
        try {
            const existEmail = await this.repo.findOne({
                where: {
                    email: dto.email,
                }
            });

            if (existEmail) {
                throw new BadRequestException(
                    {
                        errorCode: ERROR_CODE.EMAIL_EXISTS,
                        message: "Email đã tồn tại",
                    }
                );
            }

            const existPhone = await this.repo.findOne({
                where: {
                    phone: dto.phone,
                }
            });

            if (existPhone) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.PHONE_EXISTS,
                    message: "Số điện thoại đã tồn tại",
                });
            }

            const existCitizenCard = await this.repo.findOne({
                where: {
                    citizenCard: dto.citizenCard,
                }
            });

            if (existCitizenCard) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.CCCD_EXISTS,
                    message: "CCCD đã tồn tại",
                });
            }


            const qrToken = crypto.randomBytes(32).toString('hex');

            const newResident = this.repo.create({
                fullName: dto.fullName,
                phone: dto.phone || null,
                email: dto.email || null,
                citizenCard: dto.citizenCard || null,
                gender: dto.gender,
                birthday: dto.birthday ? new Date(dto.birthday) : null,
                apartment: dto.apartmentId ? { id: dto.apartmentId } as any : undefined,
                qrCode: qrToken,
                avatar: dto.avatar,
                status: 1,

                createdBy: userId,
                updatedBy: userId,

                faceIdData: null
            })
            return await this.repo.save(newResident);
        } catch (error) {
            if (error.code === '23505' || // PostgreSQL unique violation
                error.message.includes('Violation of UNIQUE KEY') || // SQL Server
                error.message.includes('duplicate key')) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.EMAIL_EXISTS,
                    message: "Email đã tồn tại",
                });
            }
            throw error;
        }
    }

    async update(residentId: number, dto: UpdateResidentDto, userId: number) {
        const resident = await this.repo.findOne({ where: { id: residentId } });

        if (!resident) {
            throw new NotFoundException({
                errorCode: ERROR_CODE.RESIDENT_NOT_FOUND,
                message: "Không tìm thấy cư dân",
            });
        }
        log(dto.version);
        log(resident.version);
        if (dto.version !== resident.version) {
            throw new BadRequestException({
                errorCode: ERROR_CODE.VERSION_CONFLICT,
                message: "Xung đột version",
            });
        }

        if (dto.phone && dto.phone !== resident.phone) {
            const existPhone = await this.repo.findOne({ where: { phone: dto.phone } });
            if (existPhone) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.PHONE_EXISTS,
                    message: "Số điện thoại đã tồn tại",
                });
            }
        }

        if (dto.email && dto.email !== resident.email) {
            const existEmail = await this.repo.findOne({ where: { email: dto.email, id: Not(residentId) } });
            if (existEmail) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.EMAIL_EXISTS,
                    message: "Email đã tồn tại",
                });
            }
        }



        Object.assign(resident, {
            fullName: dto.fullName ?? resident.fullName,
            phone: dto.phone ?? resident.phone,
            email: dto.email ?? resident.email,
            citizenCard: dto.citizenCard ?? resident.citizenCard,
            gender: dto.gender ?? resident.gender,
            birthday: dto.birthday ? new Date(dto.birthday) : resident.birthday,
            
            status: dto.status ?? resident.status,
            avatar: dto.avatar ?? null,
            updatedBy: userId,
        });

        if (dto.apartmentId) {
  resident.apartment = { id: dto.apartmentId } as any;
}
        return await this.repo.save(resident);
    }

    async remove(id: number, userId: number) {
        const resident = await this.repo.findOne({ where: { id } });

        if (!resident) {
            throw new NotFoundException({
                errorCode: ERROR_CODE.RESIDENT_NOT_FOUND,
                message: "Không tìm thấy cư dân",
            });
        }
        log(resident.status);
        log(resident.deletedAt);
        if (resident.status === BASE_STATUS.INACTIVE || resident.deletedAt !== undefined) {
            throw new BadRequestException({
                errorCode: ERROR_CODE.ALREADY_DELETED,
                message: "Đã bị xóa trước đó",
            });
        }

        resident.deletedAt = new Date();
        resident.updatedBy = userId;
        resident.status = BASE_STATUS.INACTIVE;

        return await this.repo.softRemove(resident);
    }

    async resetQrCode(id: number): Promise<Residents> {
        const newQrToken = crypto.randomBytes(32).toString('hex');
        const result = await this.repo.update(id, { qrCode: newQrToken });

        if (result.affected === 0) {
            throw new NotFoundException({
                errorCode: ERROR_CODE.RESIDENT_NOT_FOUND,
                message: "Không tìm thấy cư dân",
            });
        }

        const resident = await this.repo.findOneBy({ id });

        if (!resident) {
            throw new NotFoundException({
                errorCode: ERROR_CODE.RESIDENT_NOT_FOUND,
                message: "Không tìm thấy cư dân",
            });
        }

        return resident;
    }


    // comming soon :vvvvv
    async registerFaceId(id: number, faceIdData: Buffer): Promise<Residents> {
        const result = await this.repo.update(id, { faceIdData });

        if (result.affected === 0) {
            throw new NotFoundException({
                errorCode: ERROR_CODE.RESIDENT_NOT_FOUND,
                message: "Không tìm thấy cư dân",
            });
        }

        const resident = await this.repo.findOneBy({ id });

        if (!resident) {
            throw new NotFoundException({
                errorCode: ERROR_CODE.RESIDENT_NOT_FOUND,
                message: "Không tìm thấy cư dân",
            });
        }
        return resident;
    }

    async unregisterFaceId(id: number): Promise<void> {
        await this.repo.update(id, { faceIdData: null });
    }


    async importResidents(dtos: ImportResidentItemDto[], userId: number) {
        const results: any[] = [];
        const errors: { index: number; errorCode: string; details?: any }[] = [];

        // 1. Lấy dữ liệu để check trùng (Pre-fetch)
        const phones = dtos.map(d => d.phone ? d.phone.toString().trim() : '').filter(Boolean);
        const citizenCards = dtos.map(d => d.citizenCard ? d.citizenCard.toString().trim() : '').filter(Boolean);
        const emails = dtos.map(d => d.email ? d.email.toString().trim() : '').filter(Boolean);

        const existingPhones = await this.repo.find({ where: { phone: In(phones) } });
        const existingCccd = await this.repo.find({ where: { citizenCard: In(citizenCards) } });
        const existingEmails = emails.length ? await this.repo.find({ where: { email: In(emails) } }) : [];

        const phoneSet = new Set(existingPhones.map(r => r.phone));
        const cccdSet = new Set(existingCccd.map(r => r.citizenCard));
        const emailSet = new Set(existingEmails.map(r => r.email));

        for (let i = 0; i < dtos.length; i++) {
            const dto = dtos[i];
            const rowIndex = i + 2;

            // --- A. CHUẨN HÓA DỮ LIỆU (CLEAN DATA) ---
            const cleanPhone = dto.phone ? dto.phone.toString().trim() : '';
            const cleanEmail = dto.email ? dto.email.toString().trim() : '';
            const cleanCccd = dto.citizenCard ? dto.citizenCard.toString().trim() : '';
            
            // Xử lý Ngày sinh: Hỗ trợ cả YYYY-MM-DD và DD/MM/YYYY
            let cleanBirthday = '';
            const rawBirthday = dto.birthday ? dto.birthday.toString().trim() : '';
            
            if (rawBirthday) {
                // Nếu là dạng ISO (1990-01-01)
                if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(rawBirthday)) {
                    cleanBirthday = rawBirthday;
                } 
                // Nếu là dạng VN (01/01/1990)
                else if (rawBirthday.includes('/')) {
                    const parts = rawBirthday.split('/');
                    if (parts.length === 3) {
                        // Chuyển thành YYYY-MM-DD (đảm bảo thêm số 0 nếu thiếu)
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2];
                        cleanBirthday = `${year}-${month}-${day}`;
                    }
                }
            }

            // Xử lý Giới tính
            let cleanGender = GenderEnum.Other;
            const genderStr = dto.gender ? dto.gender.toString().toLowerCase().trim() : '';
            if (['nam', 'male', 'trai', 'Nam'].includes(genderStr)) cleanGender = GenderEnum.Male;
            if (['nữ', 'nu', 'female', 'gái', 'Nữ'].includes(genderStr)) cleanGender = GenderEnum.Female;


            // --- B. VALIDATE THỦ CÔNG (LOGIC CỨNG) ---
            
            // 1. Validate Ngày sinh
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!cleanBirthday || !dateRegex.test(cleanBirthday) || isNaN(new Date(cleanBirthday).getTime())) {
                 errors.push({ index: rowIndex, errorCode: 'FORMAT_ERROR', details: { field: 'birthday', message: `Ngày sinh không hợp lệ: "${rawBirthday}" (Yêu cầu: YYYY-MM-DD hoặc DD/MM/YYYY)` } });
                 continue;
            }

            // 2. Validate SĐT (VN)
            if (!/^(0|\+84)\d{9,10}$/.test(cleanPhone)) {
                errors.push({ index: rowIndex, errorCode: 'FORMAT_ERROR', details: { field: 'phone', message: 'SĐT không đúng định dạng (VN)' } });
                continue;
            }

            // 3. Validate CCCD (12 số)
            if (!/^\d{12}$/.test(cleanCccd)) {
                errors.push({ index: rowIndex, errorCode: 'FORMAT_ERROR', details: { field: 'citizenCard', message: 'CCCD phải có đúng 12 chữ số' } });
                continue;
            }

            // --- C. VALIDATE DTO (Dùng class-validator cho các trường còn lại như Email) ---
            const residentValidateObj = plainToInstance(CreateResidentDto, {
                ...dto,
                fullName: dto.fullName,
                phone: cleanPhone,
                citizenCard: cleanCccd,
                gender: cleanGender,
                // Trick: Email rỗng -> undefined để bỏ qua check
                email: cleanEmail !== '' ? cleanEmail : undefined,
                apartmentId: dto.apartmentId ? Number(dto.apartmentId) : undefined,
                // 🔥 Trick: Truyền undefined vào birthday để DTO KHÔNG CHECK LẠI (vì ta đã check tay rồi)
                birthday: undefined 
            });

            // Chỉ lấy lỗi không phải birthday
            const validationErrors = await validate(residentValidateObj);
            const realErrors = validationErrors.filter(err => err.property !== 'birthday');

            if (realErrors.length > 0) {
                const firstError = realErrors[0];
                const message = firstError.constraints ? Object.values(firstError.constraints)[0] : 'Lỗi định dạng';
                errors.push({ index: rowIndex, errorCode: 'FORMAT_ERROR', details: { field: firstError.property, message: message } });
                continue; 
            }

            // --- D. CHECK TRÙNG ---
            if (phoneSet.has(cleanPhone)) {
                errors.push({ index: rowIndex, errorCode: ERROR_CODE.RESIDENT_IMPORT_DUPLICATE_PHONE, details: { phone: cleanPhone } });
                continue;
            }
            if (cccdSet.has(cleanCccd)) {
                errors.push({ index: rowIndex, errorCode: ERROR_CODE.RESIDENT_IMPORT_DUPLICATE_CCCD, details: { citizenCard: cleanCccd } });
                continue;
            }
            if (cleanEmail && emailSet.has(cleanEmail)) {
                errors.push({ index: rowIndex, errorCode: ERROR_CODE.RESIDENT_IMPORT_DUPLICATE_EMAIL, details: { email: cleanEmail } });
                continue;
            }

            // --- E. LƯU VÀO DB ---
            try {
                const resident = this.repo.create({
                    fullName: dto.fullName,
                    phone: cleanPhone,
                    citizenCard: cleanCccd,
                    email: cleanEmail || null,
                    gender: cleanGender,
                    birthday: new Date(cleanBirthday), // Lúc này mới tạo Date Object an toàn
                    apartment: dto.apartmentId ? { id: Number(dto.apartmentId) } : undefined,
                    qrCode: crypto.randomBytes(32).toString('hex'),
                    avatar: null,
                    status: 1,
                    createdBy: userId,
                    updatedBy: userId,
                });

                const saved = await this.repo.save(resident);
                results.push({ id: saved.id, fullName: saved.fullName, phone: saved.phone });
            } catch (err) {
                 errors.push({ index: rowIndex, errorCode: ERROR_CODE.RESIDENT_IMPORT_SAVE_ERROR, details: { message: err instanceof Error ? err.message : 'Unknown error' } });
            }
        }

        return {
            successCount: results.length,
            errorCount: errors.length,
            successes: results,
            errors,
        };
    }

    async generateTemplateZip() {
        // 1. Khởi tạo archiver
        const archive = archiver('zip', { zlib: { level: 9 } });

        // 2. Tạo nội dung file mẫu nhập liệu (CSV 1)
        const csvTemplate = `fullName,phone,email,citizenCard,gender,birthday,apartmentId
                            Nguyễn Văn A,0901234567,a@gmail.com,012345678901,Nam,1990-01-01,5
                            Trần Thị B,0912345678,b@example.com,012345678902,Nữ,1995-05-20,8
                            Lê Văn C,0923456789,,012345678903,Khác,1988-11-10,
                            Phạm Thị D,0934567890,pham.d@example.com,012345678904,Nữ,2000-12-25,12
                            Hoàng Văn E,0945678901,hoang.e@khuc.com,012345678905,Nam,1975-06-15,`;

        archive.append('\uFEFF' + csvTemplate, { name: '1-mau-import-cu-dan.csv' });

        // 3. Lấy dữ liệu 500 phòng từ ApartmentService và tạo CSV 2
        const apartments = await this.apartmentService.findAll();
        let apartmentListContent = `apartmentId (Mã nhập liệu),Tòa/Block,Phòng,Tầng\n`;

        apartments.forEach(item => {
            // Thay đổi property .id, .name cho đúng với thực tế DB của bạn
            apartmentListContent += `${item.id},${item.building},${item.roomNumber || ''},${item.floorNumber}\n`;
        });

        archive.append('\uFEFF' + apartmentListContent, { name: '2-danh-sach-phong-tra-cuu.csv' });

        // Trả về đối tượng archive để Controller pipe vào Response
        return archive;
    }
}

