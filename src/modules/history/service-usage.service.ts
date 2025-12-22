import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FillerHistoryDto } from "./dto/filter-history.dto";
import { Repository } from "typeorm";
import { Brackets } from 'typeorm';
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";
import { ERROR_CODE } from "src/common/constants/error-code.constant";


@Injectable()
export default class ServiceUsageService {
    constructor(
        @InjectRepository(ServiceUsageHistories)
        private repo: Repository<ServiceUsageHistories>,
    ) { }

    async getHistory(filter: FillerHistoryDto) {
        const { searchName, serviceId, page = 1, limit = 10 } = filter;

        const query = this.repo.createQueryBuilder("history")
            .leftJoinAndSelect("history.resident", "resident")
            .leftJoinAndSelect("history.service", "service")
            .leftJoinAndSelect("history.staff", "staff")
            .orderBy("history.usageTime", "DESC");
        // Loc theo ten cu dan  
        if (searchName) {
            query.andWhere(
                new Brackets((qb) => {
                    qb.where("resident.fullName LIKE :name", { name: `%${searchName}%` })
                        .orWhere("service.serviceName LIKE :name", { name: `%${searchName}%` })
                })
            );

        }
        if (serviceId) {
            query.andWhere("history.serviceId = :serviceId", { serviceId })
        }
        //Phan trang
        let pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit))
        const skip = (pageNum - 1) * limitNum;
        query.skip(skip).take(limitNum);
        let [data, total] = await query.getManyAndCount();
        const TotalPages = Math.ceil(total / limitNum);
        if (total > 0 && pageNum > TotalPages) {
            throw new BadRequestException(ERROR_CODE.HISTORY_INVALID_PAGE)
        }
        return {
            data,
            meta: {
                total,
            limit: limitNum,
                page: pageNum,
                totalPages: TotalPages
            }

        }
    }

    async getDetail(id: number) {
        const history = await this.repo.findOne({
            where: { id: id },
            relations: ["resident", "service", "staff"]
        });
        if (!history) {
            throw new NotFoundException(ERROR_CODE.HISTORY_NOT_FOUND);
        }
        return history;
    }
}