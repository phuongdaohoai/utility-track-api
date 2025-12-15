import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Services } from 'src/entities/services.entity';
import { Not, OptimisticLockVersionMismatchError, Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationResult } from 'src/common/pagination.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { ApiResponse } from 'src/common/response.dto';
import { BASE_STATUS } from 'src/common/constants/base-status.constant';

@Injectable()
export class ServicesUsedService {
    constructor(
        @InjectRepository(Services)
        private repo: Repository<Services>
    ) { }

    async findAll(filter: FilterServiceDto): Promise<PaginationResult<Services>> {
        const page = filter.page ?? 1;
        const pageSize = filter.pageSize ?? 10;

        const qb = this.repo.createQueryBuilder('service');

        const totalItem = await qb.getCount();

        //panigation
        const items = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .orderBy('service.id', 'DESC')
            .getMany();

        return {
            totalItem,
            page,
            pageSize,
            items
        };
    }
    async findById(id: number) {
        const service = await this.findOne(id);
        return ApiResponse.ok(service);
    }
    async findOne(id: number) {
        const service = await this.repo.findOne({ where: { id: id } });
        if (!service) throw new NotFoundException("Không tìm thấy dịch vụ");
        return service;
    }

    async create(dto: CreateServiceDto, userId: number) {
        const exist = await this.repo.findOne({
            where: { serviceName: dto.serviceName }
        });

        if (exist) {
            throw new BadRequestException("Tên dịch vụ đã tồn tại");
        }

        const service = this.repo.create({
            ...dto,
            createdBy: userId
        });
        return await this.repo.save(service)

    }

    async update(id: number, dto: UpdateServiceDto, userId: number) {
        let service: Services | null;
        try {
            service = await this.repo
                .createQueryBuilder('service')
                .where('service.id = :id', { id })
                .setLock('optimistic', dto.version) // 👈 CHỖ QUYẾT ĐỊNH
                .getOne();
        } catch (error) {
            if (error instanceof OptimisticLockVersionMismatchError) {
                throw new ConflictException(
                    'Dữ liệu đã được cập nhật bởi người khác'
                );
            }
            throw error;
        }

        if (!service) throw new NotFoundException("không tìm thấy dịch vụ");

        if (dto.serviceName) {
            const exist = await this.repo.findOne({
                where: {
                    serviceName: dto.serviceName,
                    id: Not(id)
                },
            });
            if (exist) {
                throw new ConflictException("Tên dịch vụ đã tồn tại");
            }
        }

        Object.assign(service, {
            serviceName: dto.serviceName,
            capacity: dto.capacity,
            description: dto.description,
            price: dto.price,
            status: dto.status,
        });
        service.updatedBy = userId;

        return await this.repo.save(service);
    }

    async remove(id: number, userId: number) {
        const service = await this.findOne(id);
        if (!service) throw new NotFoundException("không tìm thấy dịch vụ");

        if (service.status === BASE_STATUS.INACTIVE || service.deletedAt != null) {
            throw new ConflictException("Dịch vụ này đã bị xóa trước đó");
        }
        service.deletedAt = new Date();
        service.updatedBy = userId;
        service.status = BASE_STATUS.INACTIVE;

        return await this.repo.softRemove(service);

    }
}

