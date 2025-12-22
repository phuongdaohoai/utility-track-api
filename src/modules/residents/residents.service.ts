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
import { log } from 'console';
import { parse } from '@fast-csv/parse';
import { Readable } from 'stream';
import { ImportResidentItemDto } from './dto/import-csv.dto';
import { ERROR_CODE } from 'src/common/constants/error-code.constant';
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
            private repo: Repository<Residents>
        ) { }
    async findAll(filter: FilterResidentDto): Promise<PaginationResult<Residents>> {
        const page = filter.page ?? 1;
        const pageSize = filter.pageSize ?? 10;

        const qb = this.repo
            .createQueryBuilder('resident')
            .leftJoinAndSelect('resident.apartment', 'apartment')
            .where('resident.deletedAt IS NULL'); // Đảm bảo không lấy bản ghi đã xóa mềm


        if (filter.search?.trim()) {
            const search = filter.search.trim();
            qb.andWhere(new Brackets(wb => {
                wb.where("resident.fullName LIKE :search COLLATE SQL_Latin1_General_CP1253_CI_AI", { search: `%${search}%` })
                    .orWhere("resident.email LIKE :search COLLATE SQL_Latin1_General_CP1253_CI_AI", { search: `%${search}%` })
                    .orWhere("resident.phone LIKE :search COLLATE SQL_Latin1_General_CP1253_CI_AI", { search: `%${search}%` })
                    .orWhere("apartment.roomNumber LIKE :search COLLATE SQL_Latin1_General_CP1253_CI_AI", { search: `%${search}%` });
            }));
        }


        if (filter.filters) {
            try {
                const filters: FilterPayload[] = typeof filter.filters === 'string'
                    ? JSON.parse(filter.filters)
                    : filter.filters;

                if (Array.isArray(filters)) {
                    filters.forEach((f, index) => {

                        let dbField = `resident.${f.field}`;
                        if (f.field === 'room') dbField = 'apartment.roomNumber';
                        if (f.field === 'joinDate') dbField = 'resident.createdAt';
                        const pName = `val_${index}_${Math.floor(Math.random() * 1000)}`;
                        const paramName = `val_${index}_${Math.floor(Math.random() * 1000)}`;
                        const paramName2 = `val_${index}_2_${Math.floor(Math.random() * 1000)}`;


                        switch (f.operator) {
                            case 'is':
                                if (f.value === 'null' || f.value === '') {
                                    qb.andWhere(`${dbField} IS NULL`);
                                } else {
                                    if (f.field === 'joinDate' || f.field === 'birthday') {
                                        const dateStr = f.value; // YYYY-MM-DD
                                        qb.andWhere(`${dbField} >= :${pName}_start AND ${dbField} <= :${pName}_end`, {
                                            [`${pName}_start`]: `${dateStr} 00:00:00`,
                                            [`${pName}_end`]: `${dateStr} 23:59:59`
                                        });
                                    } else {

                                        qb.andWhere(`${dbField} = :${pName}`, { [pName]: f.value });
                                    }
                                }
                                break;
                            case 'contains':
                                if (Array.isArray(f.value)) {
                                    qb.andWhere(new Brackets(wb => {
                                        f.value.forEach((val, i) => {
                                            const subPName = `${pName}_${i}`;

                                            wb.orWhere(`${dbField} LIKE :${subPName} COLLATE SQL_Latin1_General_CP1253_CI_AI`, { [subPName]: `%${val}%` });
                                        });
                                    }));
                                } else {
                                    qb.andWhere(`${dbField} LIKE :${pName} COLLATE SQL_Latin1_General_CP1253_CI_AI`, { [pName]: `%${f.value}%` });
                                }
                                break;
                            case 'is_not':
                                qb.andWhere(`${dbField} != :${paramName}`, { [paramName]: f.value });
                                break;

                            case 'contains':
                                qb.andWhere(`${dbField} LIKE :${paramName}`, { [paramName]: `%${f.value}%` });
                                break;

                            case 'in':
                                if (Array.isArray(f.value) && f.value.length > 0) {
                                    qb.andWhere(`${dbField} IN (:...${paramName})`, { [paramName]: f.value });
                                }
                                break;

                            case 'gt':
                                qb.andWhere(`${dbField} > :${paramName}`, { [paramName]: f.value });
                                break;

                            case 'gte':
                                qb.andWhere(`${dbField} >= :${paramName}`, { [paramName]: f.value });
                                break;

                            case 'lt':
                                qb.andWhere(`${dbField} < :${paramName}`, { [paramName]: f.value });
                                break;

                            case 'lte':
                                qb.andWhere(`${dbField} <= :${paramName}`, { [paramName]: f.value });
                                break;

                            case 'range':
                                if (f.from !== undefined && f.to !== undefined) {
                                    qb.andWhere(`${dbField} BETWEEN :${paramName} AND :${paramName2}`, {
                                        [paramName]: f.from,
                                        [paramName2]: f.to
                                    });
                                }
                                break;
                        }
                    });
                }
            } catch (error) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.RESIDENT_FILTER_PARSE_ERROR,
                    message: "Lỗi parse filter: " + error.message,
                });
            }
        }

        const totalItem = await qb.getCount();

        const items = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .orderBy('resident.id', 'DESC')
            .getMany();

        return {
            totalItem,
            page,
            pageSize,
            items
        };
    }
    async findById(id: number) {
        const resident = await this.repo.findOne(
            {
                where: { id: id },
                relations:
                    { apartment: true },
                select: {
                    apartment: {
                        building: true,
                        roomNumber: true,
                        floorNumber: true,
                    }
                }
            });
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
            apartmentId: dto.apartmentId ?? resident.apartment?.id,
            status: dto.status ?? resident.status,
            avatar: dto.avatar ?? null,
            updatedBy: userId,
        });

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

        // Kiểm tra trùng toàn bộ trước (tối ưu)
        const phones = dtos.map(d => d.phone);
        const citizenCards = dtos.map(d => d.citizenCard);
        const emails = dtos.map(d => d.email).filter(Boolean);

        const existingPhones = await this.repo.find({ where: { phone: In(phones) } });
        const existingCccd = await this.repo.find({ where: { citizenCard: In(citizenCards) } });
        const existingEmails = emails.length ? await this.repo.find({ where: { email: In(emails) } }) : [];

        const phoneSet = new Set(existingPhones.map(r => r.phone));
        const cccdSet = new Set(existingCccd.map(r => r.citizenCard));
        const emailSet = new Set(existingEmails.map(r => r.email));

        for (let i = 0; i < dtos.length; i++) {
            const dto = dtos[i];

            // Kiểm tra trùng
            if (phoneSet.has(dto.phone)) {
                errors.push({
                    index: i + 2,
                    errorCode: ERROR_CODE.RESIDENT_IMPORT_DUPLICATE_PHONE,
                    details: { phone: dto.phone },
                });
                continue;
            }
            if (cccdSet.has(dto.citizenCard)) {
                errors.push({
                    index: i + 2,
                    errorCode: ERROR_CODE.RESIDENT_IMPORT_DUPLICATE_CCCD,
                    details: { citizenCard: dto.citizenCard },
                });
                continue;
            }
            if (dto.email && emailSet.has(dto.email)) {
                errors.push({
                    index: i + 2,
                    errorCode: ERROR_CODE.RESIDENT_IMPORT_DUPLICATE_EMAIL,
                    details: { email: dto.email },
                });
                continue;
            }

            try {
                const resident = this.repo.create({
                    ...dto,
                    birthday: new Date(dto.birthday),
                    apartment: dto.apartmentId ? { id: dto.apartmentId } : undefined,
                    qrCode: crypto.randomBytes(32).toString('hex'),
                    avatar: null,
                    status: 1,
                    createdBy: userId,
                    updatedBy: userId,
                });

                const saved = await this.repo.save(resident);
                results.push({
                    id: saved.id,
                    fullName: saved.fullName,
                    phone: saved.phone,
                });
            } catch (err) {
                errors.push({
                    index: i + 2,
                    errorCode: ERROR_CODE.RESIDENT_IMPORT_SAVE_ERROR,
                    details: { message: err instanceof Error ? err.message : 'Unknown error' },
                });
            }
        }

        return {
            successCount: results.length,
            errorCount: errors.length,
            successes: results,
            errors,
        };
    }


}

