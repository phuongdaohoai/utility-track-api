import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FillerHistoryDto } from "./dto/filter-history.dto";
import { ServiceUsageHistory } from "src/entities/entities/service-usage-history.entity";
import { Repository } from "typeorm";
import { Brackets } from 'typeorm';


@Injectable()
export default class ServiceUsageService {
    constructor(
        @InjectRepository(ServiceUsageHistory)
        private repo: Repository<ServiceUsageHistory>,
    ) { }

    async getHistory(filter: FillerHistoryDto) {
        const { searchName, serviceId, page = 1, limit = 10 } = filter;

        const query = this.repo.createQueryBuilder("history")
            .leftJoinAndSelect("history.resident", "resident")
            .leftJoinAndSelect("history.service", "service")
            .leftJoinAndSelect("history.staff", "staff")
            .orderBy("history.checkInTime", "DESC");
        // Loc theo ten cu dan  
        if (searchName) {
            query.andWhere(
                new Brackets((qb) => {
                    qb.where("resident.FullName LIKE :name", { name: `%${searchName}%` })
                        .orWhere("service.ServiceName LIKE :name", { name: `%${searchName}%` })
                })
            );

        }
        //Phan trang
        let pageNum = Number(page) > 0 ? Number(page) : 1;
        const limitNum = Number(limit) > 0 ? Number(limit) : 10;
        const skip = (pageNum - 1) * limitNum;

        query.skip(skip).take(limitNum);
        let [data, total] = await query.getManyAndCount();
        const totalPages = Math.ceil(total / limitNum);
        if (total > 0 && pageNum > totalPages) {
            query.skip(0).take(limitNum);
            data = await query.getMany();
            pageNum = 1;
        }
        return {
            data,
            total,
            limit: limitNum,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limitNum)),
        }
    }

    async getDetail(id: number) {
        const history = await this.repo.findOne({
            where: { usageId: id },
            relations: ["resident", "service", "staff"]
        });
        if (!history) {
            throw new Error("Không tìm thấy thông tin cư dân");
        }
        return history;
    }
}