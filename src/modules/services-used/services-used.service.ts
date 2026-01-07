import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Services } from 'src/entities/services.entity';
import { Not, Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationResult } from 'src/common/pagination.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { BASE_STATUS } from 'src/common/constants/base-status.constant';
import { ERROR_CODE } from 'src/common/constants/error-code.constant';
import { QueryBuilderHelper } from 'src/common/helper/query-builder.helper';
import { randomUUID } from 'crypto';

@Injectable()
export class ServicesUsedService {
  constructor(
    @InjectRepository(Services)
    private repo: Repository<Services>,
  ) {}

  /* ===================== GET ALL ===================== */
  async findAll(filter: FilterServiceDto): Promise<PaginationResult<Services>> {
    const qb = this.repo.createQueryBuilder('service');

    // 🔍 Search
    QueryBuilderHelper.applySearch(qb, filter.search?.trim(), [
      { entityAlias: 'service', field: 'serviceName', collate: true },
      { entityAlias: 'service', field: 'description', collate: true },
    ]);

    // 🔽 Sort
    qb.orderBy('service.id', 'DESC');

    // 📄 Pagination
    const { items, totalItem, page, pageSize } =
      await QueryBuilderHelper.applyPagination(
        qb,
        filter.page ?? 1,
        filter.pageSize ?? 10,
      );

    const totalPages = Math.ceil(totalItem / pageSize);

    // ✅ FIX QUAN TRỌNG: trả meta cho FE
    return {
      items,
      meta: {
        totalItem,
        page,
        pageSize,
        totalPages,
      },
    };
  }

  /* ===================== GET BY ID ===================== */
  async findById(id: number) {
    const service = await this.findOne(id);
    if (!service)
      throw new NotFoundException({
        errorCode: ERROR_CODE.SERVICE_NOT_FOUND,
        message: 'Không tìm thấy dịch vụ',
      });
    return service;
  }

  async findOne(id: number) {
    const service = await this.repo.findOne({ where: { id } });
    if (!service)
      throw new NotFoundException({
        errorCode: ERROR_CODE.SERVICE_NOT_FOUND,
        message: 'Không tìm thấy dịch vụ',
      });
    return service;
  }

  /* ===================== CREATE ===================== */
  async create(dto: CreateServiceDto, userId: number) {
    const exist = await this.repo.findOne({
      where: { serviceName: dto.serviceName },
    });

    if (exist) {
      throw new BadRequestException({
        errorCode: ERROR_CODE.SERVICE_NAME_EXISTS,
        message: 'Tên dịch vụ đã tồn tại',
      });
    }

    const service = this.repo.create({
      ...dto,
      qrToken: randomUUID(),
      status: dto.status ?? BASE_STATUS.ACTIVE,
      createdBy: userId,
    });

    return await this.repo.save(service);
  }

  /* ===================== UPDATE ===================== */
  async update(id: number, dto: UpdateServiceDto, userId: number) {
    const service = await this.repo.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException({
        errorCode: ERROR_CODE.SERVICE_NOT_FOUND,
        message: 'Không tìm thấy dịch vụ',
      });
    }

    if (dto.version !== service.version) {
      throw new ConflictException({
        errorCode: ERROR_CODE.VERSION_CONFLICT,
        message: 'Xung đột version',
      });
    }

    if (dto.serviceName) {
      const exist = await this.repo.findOne({
        where: {
          serviceName: dto.serviceName,
          id: Not(id),
        },
      });
      if (exist) {
        throw new ConflictException({
          errorCode: ERROR_CODE.SERVICE_NAME_IN_USE_BY_OTHER,
          message: 'Tên dịch vụ đã dùng bởi dịch vụ khác',
        });
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

  /* ===================== DELETE ===================== */
  async remove(id: number, userId: number) {
    const service = await this.findOne(id);

    service.deletedAt = new Date();
    service.updatedBy = userId;
    service.status = BASE_STATUS.INACTIVE;

    return await this.repo.softRemove(service);
  }
}
