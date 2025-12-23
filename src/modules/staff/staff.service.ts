import { FilterStaffDto } from './dto/filter-staff.dto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Not, Repository } from 'typeorm';
import { PaginationResult } from 'src/common/pagination.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { PasswordHelper } from 'src/common/helper/password.helper';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staffs } from 'src/entities/staffs.entity';
import { BASE_STATUS } from 'src/common/constants/base-status.constant';
import { BASE_ROLE } from 'src/common/constants/base-role.constant';
import { ERROR_CODE } from 'src/common/constants/error-code.constant';
import { error } from 'console';
import { QueryHelper } from 'src/common/helper/query.helper';
import { ImportStaffItemDto } from './dto/import-staff.dto';
import * as bcrypt from 'bcrypt';
import { Roles } from 'src/entities/roles.entity';

@Injectable()
export class StaffService {
    constructor(
        @InjectRepository(Staffs)
        private repo: Repository<Staffs>
    ) { }

async findAll(filter: FilterStaffDto) {
        const qb = this.repo.createQueryBuilder('staff')
            .leftJoin('staff.role', 'role')
            .addSelect(['role.roleName', 'role.id'])
            .where('staff.deletedAt IS NULL');

        return await QueryHelper.apply(qb, filter, {
            alias: 'staff',
            searchFields: ['staff.fullName', 'staff.email', 'staff.phone'],
            fieldMap: {
                'roleId': 'role.id',
                'createdAt': 'staff.createdAt'
            },
            // Chỉ định trường ngày tháng
            dateFields: ['createdAt', 'updatedAt']
        });
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

    async importStaffs(dtos: ImportStaffItemDto[], userId: number) {
        const results: any[] = [];
        const errors: { index: number; errorCode: string; details?: any }[] = [];

        // Kiểm tra trùng email và phone
        const emails = dtos.map(d => d.email.toLowerCase().trim());
        const phones = dtos.map(d => d.phone).filter(Boolean);

        const existingEmails = await this.repo.find({ where: { email: In(emails) } });
        const existingPhones = phones.length ? await this.repo.find({ where: { phone: In(phones) } }) : [];

        const emailSet = new Set(existingEmails.map(s => s.email.toLowerCase()));
        const phoneSet = new Set(existingPhones.map(s => s.phone));

        // Kiểm tra roleId có tồn tại không (tối ưu 1 lần)
        const roleIds = [...new Set(dtos.map(d => d.roleId))];
        const existingRoles = await this.repo.find({ where: { id: In(roleIds) } });
        const roleIdSet = new Set(existingRoles.map(r => r.id));

        for (let i = 0; i < dtos.length; i++) {
            const dto = dtos[i];

            // Check trùng email
            if (emailSet.has(dto.email.toLowerCase().trim())) {
                errors.push({
                    index: i + 2,
                    errorCode: 'STAFF_IMPORT_DUPLICATE_EMAIL',
                    details: { email: dto.email },
                });
                continue;
            }

            // Check trùng phone (nếu có)
            if (dto.phone && phoneSet.has(dto.phone.trim())) {
                errors.push({
                    index: i + 2,
                    errorCode: 'STAFF_IMPORT_DUPLICATE_PHONE',
                    details: { phone: dto.phone },
                });
                continue;
            }

            // Check role tồn tại
            if (!roleIdSet.has(dto.roleId)) {
                errors.push({
                    index: i + 2,
                    errorCode: 'STAFF_IMPORT_INVALID_ROLE',
                    details: { roleId: dto.roleId },
                });
                continue;
            }

            try {
                // Generate password nếu không có
                const rawPassword = (dto.password || dto.phone) as string;
                const passwordHash = await PasswordHelper.hassPassword(rawPassword);



                const staff = this.repo.create({
                    fullName: dto.fullName.trim(),
                    email: dto.email.toLowerCase().trim(),
                    phone: dto.phone?.trim() || null,
                    passwordHash,
                    status: 1,
                    role: { id: dto.roleId } as Roles,
                    createdBy: userId,
                    updatedBy: userId,
                });

                const saved = await this.repo.save(staff);

                results.push({
                    id: saved.id,
                    fullName: saved.fullName,
                    email: saved.email,
                    generatedPassword: dto.password ? null : rawPassword,
                });
            } catch (err) {
                errors.push({
                    index: i + 2,
                    errorCode: 'STAFF_IMPORT_SAVE_ERROR',
                    details: { message: err instanceof Error ? err.message : 'Lỗi không xác định' },
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

