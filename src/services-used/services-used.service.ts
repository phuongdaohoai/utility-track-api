import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Services } from 'src/entities/entities/services.entity';
import { Not, Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationResult } from 'src/common/pagination.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { ApiResponse } from 'src/common/response.dto';

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
            .orderBy('service.serviceId', 'DESC')
            .getMany();

        return {
            totalItem,
            page,
            pageSize,
            items
        };
    }
    async findById(id: number) {
        const service= await this.findOne(id);
        return ApiResponse.ok(service);
    }
    async findOne(id: number) {
        const service = await this.repo.findOne({ where: { serviceId: id } });
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
        const saved = await this.repo.save(service)
        return ApiResponse.ok(saved, "Thêm Dịch Vụ Thành Công");
    }

    async update(id: number, dto: UpdateServiceDto, userId: number) {

        const service = await this.findOne(id);

        const clientUpdatedAt = new Date(dto.updatedAt).getTime();
        const serverUpdatedAt = new Date(service.updatedAt).getTime();

        if (clientUpdatedAt !== serverUpdatedAt) {
            throw new ConflictException(
                "Dịch vụ đã được chỉnh sửa bởi người khác. Vui lòng tải lại dữ liệu mới nhất và thử lại!"
            );
        }
  
        if (dto.serviceName) {
            const exist = await this.repo.findOne({
                where: {
                    serviceName: dto.serviceName,
                    serviceId: Not(id)
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

        const saved = await this.repo.save(service);
        return ApiResponse.ok(saved, "Cập Nhật Dịch Vụ Thành Công");
    }

    async remove(id: number, userId: number) {
        const service = await this.findOne(id);
        if (!service) throw new NotFoundException("không tìm thấy dịch vụ");

        if (service.status === 0 || service.deletedAt != null) {
            throw new ConflictException("Dịch vụ này đã bị xóa trước đó");
        }
        service.deletedAt = new Date();
        service.updatedBy = userId;
        service.status = 0;

        const saved = await this.repo.softRemove(service);
        return ApiResponse.ok(saved, "Xóa Dịch Vụ Thành Công");
    }
}
