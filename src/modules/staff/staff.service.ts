import { FilterStaffDto } from './dto/filter-staff.dto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { PaginationResult } from 'src/common/pagination.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { PasswordHelper } from 'src/helper/password.helper';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staffs } from 'src/entities/staffs.entity';
import { BASE_STATUS } from 'src/common/constants/base-status.constant';
import { BASE_ROLE } from 'src/common/constants/base-role.constant';
import { ERROR_CODE } from 'src/common/constants/error-code.constant';
import { error } from 'console';
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
                throw new BadRequestException({
                    errorCode: ERROR_CODE.STAFF_FILTER_PARSE_ERROR,
                    message: 'Định dạng bộ lọc không hợp lệ', 
                    details: { error: error.message } 
                });
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

        if (!staff) throw new NotFoundException({
            errorCode: ERROR_CODE.STAFF_NOT_FOUND,
            message: "Không tìm thấy nhân viên",
        });
        return staff;
    }

    async findById(id: number) {
        const staff = await this.findOne(id);
        console.log(staff);
        return staff;
    }

    async create(dto: CreateStaffDto, userId: number) {
        try {
            const existEmail = await this.repo.findOne({
                where: {
                    email: dto.email,
                }
            });

            if (existEmail) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.EMAIL_EXISTS,
                    message: "Email đã tồn tại",
                });
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

            const defaultPassword = dto.phone;
            const passwordHash = await PasswordHelper.hassPassword(defaultPassword);




            const staff = this.repo.create({
                ...dto,
                fullName: dto.fullName,
                passwordHash,
                avatar: dto.avatar ?? null,
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
                throw new BadRequestException({
                    errorCode: ERROR_CODE.EMAIL_EXISTS,
                    message: "Email đã tồn tại",
                });
            }
            // Các lỗi khác thì throw lại
            throw error;
        }
    }

    async update(staffId: number, dto: UpdateStaffDto, userId: number) {
        const staff = await this.findOne(staffId);

        if (!staff) {
            throw new NotFoundException({
                errorCode: ERROR_CODE.STAFF_NOT_FOUND,
                message: "Không tìm thấy nhân viên",
            });
        }

        if (dto.version !== staff.version) {
            throw new ConflictException(
                {
                    errorCode: ERROR_CODE.VERSION_CONFLICT,
                    message: "Xung đột version",
                }
            );
        }

        if (dto.phone && dto.phone !== staff.phone) {
            const existPhone = await this.repo.findOne({ where: { phone: dto.phone, id: Not(staffId) } });
            if (existPhone) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.STAFF_PHONE_IN_USE_BY_OTHER,
                    message: "Số điện thoại đã được sử dụng bởi nhân viên khác",
                });
            }
        }

        // Kiểm tra trùng email mới (nếu thay đổi)
        if (dto.email && dto.email !== staff.email) {
            const existEmail = await this.repo.findOne({ where: { email: dto.email, id: Not(staffId) } });
            if (existEmail) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.STAFF_EMAIL_IN_USE_BY_OTHER,
                    message: "Email đã được sử dụng bởi nhân viên khác",
                });
            }
        }
        if (dto.password && dto.password.trim().length > 0) {
            // Hash password mới và gán vào entity
            const newPasswordHash = await PasswordHelper.hassPassword(dto.password);
            staff.passwordHash = newPasswordHash;
        }

        Object.assign(staff, {
            fullName: dto.fullName ?? staff.fullName,
            phone: dto.phone ?? staff.phone,
            email: dto.email ?? staff.email,
            status: dto.status ?? staff.status,
            roleId: dto.roleId ?? staff.role.id,
            avatar: dto.avatar ?? null,
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
            throw new NotFoundException({
                errorCode: ERROR_CODE.STAFF_NOT_FOUND,
                message: "Không tìm thấy nhân viên",
            });
        }

        if (staff.id === userId) {
            throw new BadRequestException({
                errorCode: ERROR_CODE.STAFF_CANNOT_DELETE_SELF,
                message: "Không thể xóa chính mình",
            });
        }

        if (staff.id === BASE_ROLE.SUPER_ADMIN.ID) {
            throw new BadRequestException({
                errorCode: ERROR_CODE.STAFF_CANNOT_DELETE_SUPER_ADMIN,
                message: "Không thể xóa tài khoản có vai trò Super Administrator",
            });
        }

        if (staff.role?.roleName === BASE_ROLE.SUPER_ADMIN.NAME) {
            throw new BadRequestException({
                errorCode: ERROR_CODE.STAFF_CANNOT_DELETE_SUPER_ADMIN,
                message: "Không thể xóa tài khoản có vai trò Super Administrator",
            });
        }

        if (staff.status === BASE_STATUS.INACTIVE || staff.deletedAt !== undefined) {
            throw new ConflictException({
                errorCode: ERROR_CODE.ALREADY_DELETED,
                message: "Đã bị xóa trước đó",
            });
        }

        staff.updatedBy = userId;
        staff.status = BASE_STATUS.INACTIVE;
        ``
        return await this.repo.softRemove(staff);
    }
}

