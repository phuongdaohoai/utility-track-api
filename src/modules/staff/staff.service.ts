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
import { BASE_ROLE } from 'src/common/constants/base-role.constant';
@Injectable()
export class StaffService {
    constructor(
        @InjectRepository(Staffs)
        private repo: Repository<Staffs>
    ) { }

    async findAll(filter: FilterStaffDto): Promise<PaginationResult<Staffs>> {
        const page = filter.page ?? 1;
        const pageSize = filter.pageSize ?? 10;

        const qb = this.repo.createQueryBuilder('staff').leftJoin('staff.role', 'role').addSelect(['role.roleName']);

        if (filter.search?.trim()) {
            const search = filter.search.trim();

            qb.andWhere(new Brackets(wb => {
                wb.where("staff.fullName LIKE '%' + :search + '%' COLLATE SQL_Latin1_General_CP1253_CI_AI", { search })
                    .orWhere("staff.email LIKE '%' + :search + '%' COLLATE SQL_Latin1_General_CP1253_CI_AI", { search })
                    .orWhere("staff.phone LIKE '%' + :search + '%'", { search });
            }));
        }

        const totalItem = await qb.getCount();

        //pagination
        const items = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .orderBy('staff.id', 'DESC')
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

    async create(dto: CreateStaffDto, userId: number) {
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

            


            const staff = this.repo.create({
                ...dto,
                fullName: dto.fullName,
                passwordHash,
                avatar: dto.avatar??null,
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

    async update(staffId: number, dto: UpdateStaffDto, userId: number) {
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
            const existPhone = await this.repo.findOne({ where: { phone: dto.phone , id : Not(staffId)} });
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


        Object.assign(staff, {
            fullName: dto.fullName ?? staff.fullName,
            phone: dto.phone ?? staff.phone,
            email: dto.email ?? staff.email,
            status: dto.status ?? staff.status,
            roleId: dto.roleId ?? staff.role.id,
            avatar: dto.avatar??null,
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

        if (staff.id === BASE_ROLE.SUPER_ADMIN.ID) {
            throw new BadRequestException('Không thể xóa tài khoản Super Administrator');
        }

        if (staff.role?.roleName === BASE_ROLE.SUPER_ADMIN.NAME) {
            throw new BadRequestException('Không thể xóa tài khoản có vai trò Super Administrator');
        }

        if (staff.status === BASE_STATUS.INACTIVE || staff.deletedAt !== undefined) {
            throw new ConflictException('Nhân viên này đã bị xóa trước đó');
        }

        staff.updatedBy = userId;
        staff.status = BASE_STATUS.INACTIVE;
``
        return await this.repo.softRemove(staff);
    }
}

