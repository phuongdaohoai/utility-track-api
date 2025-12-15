import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Residents } from 'src/entities/residents.entity';
import { Brackets, Not, Repository } from 'typeorm';
import { FilterResidentDto } from './dto/filter-resident.dto';
import { PaginationResult } from 'src/common/pagination.dto';
import { CreateResidentDto } from './dto/create-resident.dto';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as crypto from 'crypto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { BASE_STATUS } from 'src/common/constants/base-status.constant';
import { log } from 'console';
import { NotFoundError } from 'rxjs';
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

        const qb = this.repo.createQueryBuilder('resident');

        if (filter.search?.trim()) {
            const search = filter.search.trim();

            qb.andWhere(new Brackets(wb => {
                wb.where("resident.fullName LIKE '%' + :search + '%' COLLATE SQL_Latin1_General_CP1253_CI_AI", { search })
                    .orWhere("resident.email LIKE '%' + :search + '%' COLLATE SQL_Latin1_General_CP1253_CI_AI", { search })
                    .orWhere("resident.phone LIKE '%' + :search + '%' COLLATE SQL_Latin1_General_CP1253_CI_AI", { search })
            }))
        }

        const totalItem = await qb.getCount();

        //panigation
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

    async create(dto: CreateResidentDto, file: Express.Multer.File | undefined, userId: number) {
        try {
            const existEmail = await this.repo.findOne({
                where: {
                    email: dto.email,
                }
            });

            if (existEmail) {
                throw new BadRequestException("Email đã tồn tại");
            }

            const existPhone = await this.repo.findOne({
                where: {
                    phone: dto.phone,
                }
            });

            if (existPhone) {
                throw new BadRequestException("Số điện thoại đã tồn tại");
            }

            let avatarUrl: string | null = null;

            // CHỈ LƯU FILE KHI ĐÃ QUA VALIDATE
            if (file) {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');
                const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
                const filename = `${randomName}.${ext}`;

                const rootPath = process.cwd(); // lấy root project (luôn đúng dù ở dist hay src)
                const filePath = join(rootPath, 'public', 'avatars', filename);

                const dir = join(rootPath, 'public', 'avatars');
                if (!existsSync(dir)) {
                    mkdirSync(dir, { recursive: true });
                }

                writeFileSync(filePath, file.buffer);

                avatarUrl = `/avatars/${filename}`;
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
                avatar: avatarUrl,
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
                throw new BadRequestException('Email đã tồn tại');
            }

            // Các lỗi khác thì throw lại
            throw error;
        }
    }

    async update(residentId: number, dto: UpdateResidentDto, file: Express.Multer.File | undefined, userId: number) {
        const resident = await this.repo.findOne({ where: { id: residentId } });

        if (!resident) {
            throw new NotFoundException("Không tìm thấy cư dân");
        }
        log(dto.version);
        log(resident.version);
        if (dto.version !== resident.version) {
            throw new BadRequestException("Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại dữ liệu mới nhất!");
        }

        if (dto.phone && dto.phone !== resident.phone) {
            const existPhone = await this.repo.findOne({ where: { phone: dto.phone } });
            if (existPhone) {
                throw new BadRequestException("Số điện thoại đã được sử dụng bởi cư dân khác");
            }
        }

        if (dto.email && dto.email !== resident.email) {
            const existEmail = await this.repo.findOne({ where: { email: dto.email, id: Not(residentId) } });
            if (existEmail) {
                throw new BadRequestException("Email đã được sử dụng bởi cư dân khác");
            }
        }

        let avatarUrl = resident.avatar;
        if (file) {
            const randomName = Array(32)
                .fill(null)
                .map(() => Math.round(Math.random() * 16).toString(16))
                .join('');
            const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
            const filename = `${randomName}.${ext}`;

            const rootPath = process.cwd();
            const filePath = join(rootPath, 'public', 'avatars', filename);

            const dir = join(rootPath, 'public', 'avatars');
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }

            writeFileSync(filePath, file.buffer);

            avatarUrl = `/avatars/${filename}`;
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
            avatar: avatarUrl,
            updatedBy: userId,
        });

        return await this.repo.save(resident);
    }

    async remove(id: number, userId: number) {
        const resident = await this.repo.findOne({ where: { id } });

        if (!resident) {
            throw new NotFoundException("Không tìm thấy cư dân");
        }
        log(resident.status);
        log(resident.deletedAt);
        if (resident.status === BASE_STATUS.INACTIVE || resident.deletedAt !== undefined) {
            throw new BadRequestException("Cư dân này đã bị xóa trước đó");
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
            throw new NotFoundException("Không tìm thấy cư dân");
        }

        const resident = await this.repo.findOneBy({ id });

        if (!resident) {
            throw new NotFoundException("Không tìm thấy cư dân");
        }

        return resident;
    }


    // comming soon :vvvvv
    async registerFaceId(id: number, faceIdData: Buffer): Promise<Residents> {
        const result = await this.repo.update(id, { faceIdData });

        if (result.affected === 0) {
            throw new NotFoundException("Không tìm thấy cư dân");
        }

        const resident = await this.repo.findOneBy({ id });

        if (!resident) {
            throw new NotFoundException("Không tìm thấy cư dân");
        }
        return resident;
    }

    async unregisterFaceId(id: number): Promise<void> {
        await this.repo.update(id, { faceIdData: null });
    }
}
