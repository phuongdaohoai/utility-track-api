import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FillerHistoryDto } from "./dto/filter-history.dto";
import { Repository } from "typeorm";
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
        // 1. Tạo query cơ bản
        const query = this.repo.createQueryBuilder("history")
            .leftJoinAndSelect("history.resident", "resident")
            .leftJoinAndSelect("history.service", "service")
            .leftJoinAndSelect("history.staff", "staff")
            .orderBy("history.usageTime", "DESC");

        // 2. Áp dụng tìm kiếm bằng Helper 
        if (filter.searchName) {
            QueryBuilderHelper.applySearch(query, filter.searchName.trim(), [
                { entityAlias: 'resident', field: 'fullName', collate: true },
                { entityAlias: 'service', field: 'serviceName', collate: true },
            ]);
        }
        // 3. Phân trang bằng Helper
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 10;

        const { items, totalItem, page: currentPage, pageSize } = await QueryBuilderHelper.applyPagination(
            query,
            page,
            limit,
        );

        // 4. Logic check trang không hợp lệ
        const totalPages = Math.ceil(totalItem / limit);

        if (totalItem > 0 && page > totalPages) {
            throw new BadRequestException(ERROR_CODE.HISTORY_INVALID_PAGE || 'Trang không hợp lệ');
        }

        // 5. Trả về format
        return {
            data: items,
            meta: {
                total: totalItem,
                limit: pageSize,
                page: currentPage,
                totalPages: totalPages,
            }
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