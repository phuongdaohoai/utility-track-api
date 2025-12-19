import { FilterStaffDto } from './dto/filter-staff.dto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Injector } from '@nestjs/core/injector/injector';
import { InjectRepository } from '@nestjs/typeorm';
import { StaffModule } from './staff.module';
import { Brackets, Not, Repository } from 'typeorm';
import { PaginationResult } from 'src/common/pagination.dto';
import { ApiResponse } from 'src/common/response.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { PasswordHelper } from 'src/helper/password.helper';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { Staffs } from 'src/entities/staffs.entity';
import { BASE_STATUS } from 'src/common/constants/base-status.constant';
import { log } from 'console';
@Injectable()
export class StaffService {
    constructor(
        @InjectRepository(Staffs)
        private repo: Repository<Staffs>
    ) { }

    async findAll(filter: FilterStaffDto): Promise<PaginationResult<Staffs>> {
        const page = filter.page ?? 1;
        const pageSize = filter.pageSize ?? 10;

        const qb = this.repo.createQueryBuilder('staff')
            .leftJoin('staff.role', 'role')
            .addSelect(['role.roleName', 'role.id']) // Lấy thêm ID để map filter
            .where('staff.deletedAt IS NULL'); // Chỉ lấy chưa xóa

        // 1. TÌM KIẾM CHUNG (Giữ nguyên logic cũ)
        if (filter.search?.trim()) {
            const search = filter.search.trim();
            qb.andWhere(new Brackets(wb => {
                wb.where("staff.fullName LIKE :search", { search: `%${search}%` })
                    .orWhere("staff.email LIKE :search", { search: `%${search}%` })
                    .orWhere("staff.phone LIKE :search", { search: `%${search}%` });
            }));
        }

        if (filter.filters) {
            try {
                const filters = typeof filter.filters === 'string'
                    ? JSON.parse(filter.filters)
                    : filter.filters;

                if (Array.isArray(filters)) {
                    filters.forEach((f, index) => {
                        let dbField = `staff.${f.field}`;

                        if (f.field === 'roleId') dbField = 'role.id';

                        if (f.field === 'createdAt') dbField = 'staff.createdAt';

                        const pName = `s_val_${index}_${Math.floor(Math.random() * 10000)}`;

                        switch (f.operator) {
                            case 'is':
                                if (f.field === 'createdAt') {
                                    const dateStr = f.value;
                                    qb.andWhere(`${dbField} >= :${pName}_start AND ${dbField} <= :${pName}_end`, {
                                        [`${pName}_start`]: `${dateStr} 00:00:00`,
                                        [`${pName}_end`]: `${dateStr} 23:59:59`
                                    });
                                } else if (f.value === 'null' || f.value === null) {
                                    qb.andWhere(`${dbField} IS NULL`);
                                } else {
                                    qb.andWhere(`${dbField} = :${pName}`, { [pName]: f.value });
                                }
                                break;

                            case 'is_not':
                                qb.andWhere(`${dbField} != :${pName}`, { [pName]: f.value });
                                break;

                            case 'contains':
                                if (Array.isArray(f.value)) {
                                    qb.andWhere(new Brackets(wb => {
                                        f.value.forEach((v, i) => {
                                            const subP = `${pName}_${i}`;
                                            wb.orWhere(`${dbField} LIKE :${subP} COLLATE SQL_Latin1_General_CP1253_CI_AI`, { [subP]: `%${v}%` });
                                        });
                                    }));
                                } else {
                                    qb.andWhere(`${dbField} LIKE :${pName} COLLATE SQL_Latin1_General_CP1253_CI_AI`, { [pName]: `%${f.value}%` });
                                }
                                break;

                            case 'in':
                                if (Array.isArray(f.value) && f.value.length > 0) {
                                    qb.andWhere(`${dbField} IN (:...${pName})`, { [pName]: f.value });
                                }
                                break;

                            case 'range':
                                let toVal = f.to;
                                if (f.field === 'createdAt' && f.to) toVal = `${f.to} 23:59:59`;

                                if (f.from && f.to) {
                                    qb.andWhere(`${dbField} BETWEEN :${pName}_from AND :${pName}_to`, {
                                        [`${pName}_from`]: f.from,
                                        [`${pName}_to`]: toVal
                                    });
                                }
                                break;


                        }
                    });
                }
            } catch (error) {
                console.error("Lỗi parse filter Staff:", error);
            }
        }

        const totalItem = await qb.getCount();

        const items = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .orderBy('staff.id', 'DESC') // Sắp xếp mới nhất lên đầu
            .getMany();

        return {
            totalItem,
            page,
            pageSize,
            items
        };
    }
    async findOne(id: number) {
        const staff = await this.repo.findOne({
            where: { id: id },
            relations: {
                role: {
                    permissions: true
                }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatar: true,
                status: true,
                version: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    id: true,
                    roleName: true
                }
            }
        });

        if (!staff) throw new NotFoundException("Không tìm thấy nhân viên");
        return staff;
    }

    async findById(id: number) {
        const staff = await this.findOne(id);
        console.log(staff);
        return staff;
    }

    async create(dto: CreateStaffDto, file: Express.Multer.File | undefined, userId: number) {
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

            const defaultPassword = dto.phone;
            const passwordHash = await PasswordHelper.hassPassword(defaultPassword);

            //xử lý ảnh
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

                // TỰ ĐỘNG TẠO THƯ MỤC NẾU CHƯA CÓ
                const dir = join(rootPath, 'public', 'avatars');
                if (!existsSync(dir)) {
                    mkdirSync(dir, { recursive: true });
                }

                writeFileSync(filePath, file.buffer);

                avatarUrl = `/avatars/${filename}`;
            }


            const staff = this.repo.create({
                ...dto,
                fullName: dto.fullName,
                passwordHash,
                avatar: avatarUrl,
                role: { id: dto.roleId } as any,
                status: 1,
                createdBy: userId,
                updatedBy: userId
            })

            return await this.repo.save(staff);
        } catch (error) {
            // BẮT LỖI UNIQUE VIOLATION TỪ SQL SERVER (nếu có trường hợp lọt)
            if (error.code === '23505' || // PostgreSQL unique violation
                error.message.includes('Violation of UNIQUE KEY') || // SQL Server
                error.message.includes('duplicate key')) {
                throw new BadRequestException('Email đã tồn tại');
            }

            // Các lỗi khác thì throw lại
            throw error;
        }
    }

    async update(staffId: number, dto: UpdateStaffDto, file: Express.Multer.File | undefined, userId: number) {
        const staff = await this.findOne(staffId);

        if (!staff) {
            throw new NotFoundException("Không tìm thấy nhân viên");
        }

        if (dto.version !== staff.version) {
            throw new ConflictException(
                'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại dữ liệu mới nhất!'
            );
        }

        if (dto.phone && dto.phone !== staff.phone) {
            const existPhone = await this.repo.findOne({ where: { phone: dto.phone, id: Not(staffId) } });
            if (existPhone) {
                throw new BadRequestException('Số điện thoại đã được sử dụng bởi nhân viên khác');
            }
        }

        // Kiểm tra trùng email mới (nếu thay đổi)
        if (dto.email && dto.email !== staff.email) {
            const existEmail = await this.repo.findOne({ where: { email: dto.email, id: Not(staffId) } });
            if (existEmail) {
                throw new BadRequestException('Email đã được sử dụng bởi nhân viên khác');
            }
        }
        if (dto.password && dto.password.trim().length > 0) {
            // Hash password mới và gán vào entity
            const newPasswordHash = await PasswordHelper.hassPassword(dto.password);
            staff.passwordHash = newPasswordHash;
        }


        let avatarUrl = staff.avatar;
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

        Object.assign(staff, {
            fullName: dto.fullName ?? staff.fullName,
            phone: dto.phone ?? staff.phone,
            email: dto.email ?? staff.email,
            status: dto.status ?? staff.status,
            roleId: dto.roleId ?? staff.role.id,
            avatar: avatarUrl,
            updatedBy: userId,
        });

        return await this.repo.save(staff);

    }

    async remove(id: number, userId: number) {

        const staff = await this.repo.findOne({
            where: { id },
            relations: { role: true },
            withDeleted: false, // chỉ lấy chưa soft delete
        });

        if (!staff) {
            throw new NotFoundException('Không tìm thấy nhân viên');
        }

        if (staff.id === userId) {
            throw new BadRequestException('Bạn không thể tự xóa tài khoản của chính mình');
        }

        if (staff.id === 1) {
            throw new BadRequestException('Không thể xóa tài khoản Super Administrator');
        }

        if (staff.role?.roleName === 'SuperAdmin') {
            throw new BadRequestException('Không thể xóa tài khoản có vai trò Super Administrator');
        }

        if (staff.status === BASE_STATUS.INACTIVE || staff.deletedAt !== undefined) {
            throw new ConflictException('Nhân viên này đã bị xóa trước đó');
        }

        // 6. Thực hiện soft delete
        staff.deletedAt = new Date();
        staff.updatedBy = userId;
        staff.status = BASE_STATUS.INACTIVE;
        ``
        return await this.repo.softRemove(staff);
    }
}

