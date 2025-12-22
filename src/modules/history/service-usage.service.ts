import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FillerHistoryDto } from "./dto/filter-history.dto";
import { Repository } from "typeorm";
import { Brackets } from 'typeorm';
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";
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
            throw new Error("Không tìm thấy thông tin cư dân");
        }
        return history;
    }
}