import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FillerHistoryDto } from "./dto/filter-history.dto";
import { Repository } from "typeorm";
import { Brackets } from 'typeorm';
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";
import { ERROR_CODE } from "src/common/constants/error-code.constant";
import { QueryBuilderHelper } from "src/common/helper/query-builder.helper";



@Injectable()
export default class ServiceUsageService {
    constructor(
        @InjectRepository(ServiceUsageHistories)
        private repo: Repository<ServiceUsageHistories>,
    ) { }

    async getHistory(filter: FillerHistoryDto) {

        const query = this.repo.createQueryBuilder("history")
            .leftJoinAndSelect("history.resident", "resident")
            .leftJoinAndSelect("history.service", "service")
            .leftJoinAndSelect("history.staff", "staff")
            .orderBy("history.usageTime", "DESC");
        // Loc theo ten cu dan  
        QueryBuilderHelper.applySearch(query, filter.searchName?.trim(), [
            { entityAlias: 'resident', field: 'fullName', collate: true },
            { entityAlias: 'service', field: 'serviceName', collate: true },
        ]);
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
        query.orderBy('history.usageTime', 'DESC');

        // 4. Phân trang
        const { items, totalItem, page, pageSize } = await QueryBuilderHelper.applyPagination(
            query,
            filter.page ?? 1,
            filter.limit ?? 10,
        );

        return {
            items,
            totalItem,
            page,
            pageSize,
        };
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