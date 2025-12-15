import { FilterStaffDto } from './dto/filter-staff.dto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Injector } from '@nestjs/core/injector/injector';
import { InjectRepository } from '@nestjs/typeorm';
import { Staff } from 'src/entities/entities/staff.entity';
import { StaffModule } from './staff.module';
import { Brackets, Not, Repository } from 'typeorm';
import { PaginationResult } from 'src/common/pagination.dto';
import { ApiResponse } from 'src/common/response.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { PasswordHelper } from 'src/helper/password.helper';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
@Injectable()
export class StaffService {
    constructor(
        @InjectRepository(Staff)
        private repo: Repository<Staff>
    ) { }

    async findAll(filter: FilterStaffDto): Promise<PaginationResult<Staff>> {
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
            .orderBy('staff.staffId', 'DESC')
            .getMany();

        return {
            totalItem,
            page,
            pageSize,
            items
        };
    }
    async findOne(id: number) {
        const staff = await this.repo.findOne({ where: { staffId: id } });
        if (!staff) throw new NotFoundException("Không tìm thấy nhân viên");
        return staff;
    }

    async findById(id: number) {
        const staff = await this.findOne(id);
        return ApiResponse.ok(staff);
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
                createdBy: userId,
                updatedBy: userId
            })

            const saved = await this.repo.save(staff);
            return ApiResponse.ok(saved, "Thêm Nhân Viên Thành Công");
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

        if (dto.phone && dto.phone !== staff.phone) {
            const existPhone = await this.repo.findOne({ where: { phone: dto.phone } });
            if (existPhone) {
                throw new BadRequestException('Số điện thoại đã được sử dụng bởi nhân viên khác');
            }
        }

        // Kiểm tra trùng email mới (nếu thay đổi)
        if (dto.email && dto.email !== staff.email) {
            const existEmail = await this.repo.findOne({ where: { email: dto.email } });
            if (existEmail) {
                throw new BadRequestException('Email đã được sử dụng bởi nhân viên khác');
            }
        }

        const clientUpdatedAt = new Date(dto.updatedAt).getTime();
        const serverUpdatedAt = new Date(staff.updatedAt).getTime();

        if (clientUpdatedAt !== serverUpdatedAt) {
            throw new ConflictException(
                "Dịch vụ đã được chỉnh sửa bởi người khác. Vui lòng tải lại dữ liệu mới nhất và thử lại!"
            );
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
            roleId: dto.roleId ?? staff.roleId,
            avatar: avatarUrl,
            updatedBy: userId,
        });

        const saved = await this.repo.save(staff);
        return ApiResponse.ok(
            {
                ...saved,
                avatar: avatarUrl ? `http://localhost:3000${avatarUrl}` : null
            },
            "Cập nhật nhân viên thành công"
        );
    }

    async remove(id: number, userId: number) {
        const staff = await this.findOne(id);

        if (staff.staffId == 1) {
            throw new BadRequestException("Không thể xóa tài khoản SuperAdmin")
        }
        if (staff.status === 0 || staff.deletedAt != null) {
            throw new ConflictException("Nhân viên này đã bị xóa trước đó");
        }
        staff.deletedAt = new Date();
        staff.updatedBy = userId;
        staff.status = 0;

        const result = await this.repo.softRemove(staff);
        return ApiResponse.ok(result, "Xóa Nhân Viên Thành Công");
    }
}

