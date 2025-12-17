import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FillerHistoryDto } from "./dto/filter-history.dto";
import { Repository } from "typeorm";
import { Brackets } from 'typeorm';
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";
import { Residents } from "src/entities/residents.entity";
import { CheckInOuts } from "src/entities/check-in-outs.entity";



@Injectable()
export default class ServiceUsageService {
    constructor(
        @InjectRepository(ServiceUsageHistories)
        private repo: Repository<ServiceUsageHistories>,
        @InjectRepository(Residents)
        private residentRepo: Repository<Residents>,
        @InjectRepository(CheckInOuts)
        private checkInRepo: Repository<CheckInOuts>,
    ) { }

    async getHistory(filter: FillerHistoryDto) {
        const { searchName, page = 1, limit = 10 } = filter;

        const query = this.checkInRepo.createQueryBuilder("history")
            .leftJoinAndSelect("history.resident", "resident")
            .leftJoinAndSelect("history.service", "service")
            .leftJoinAndSelect("history.staff", "staff")
            .where("history.service_id IS NOT NULL")
            .orderBy("history.checkInTime", "DESC");
        // Loc theo ten cu dan  
        if (searchName) {
            query.andWhere(
                new Brackets((qb) => {
                    qb.where("resident.fullName LIKE :name", { name: `%${searchName}%` })
                        .orWhere("service.serviceName LIKE :name", { name: `%${searchName}%` })
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
        const history = await this.checkInRepo.findOne({
            where: { id: id },
            relations: ["resident", "resident.apartment", "service", "staff"]
        });

        if (!history) {
            throw new NotFoundException(`Không tìm thấy dữ liệu check-in với ID: ${id}`);
        }

        let familyMembers: Residents[] = [];
        let apartmentName = 'Khách vãng lai'; // Mặc định là khách

        if (history.resident?.apartment) {
            apartmentName = `${history.resident.apartment.building} - ${history.resident.apartment.roomNumber}`;

            // Chỉ tìm thành viên khi chắc chắn có căn hộ
            familyMembers = await this.residentRepo.find({
                where: {
                    apartment: { id: history.resident.apartment.id }
                },
                select: ["id", "fullName"]
            });
        }

        return {
            id: history.id,
            apartment: apartmentName,
            representative: history.resident?.fullName || history.guestName || "Không tên",
            serviceName: history.service?.serviceName || "Chưa đăng ký",
            checkInMethod: history.method,
            checkInTime: history.checkInTime,
            totalMembers: familyMembers.length || 1,
            members: familyMembers.map((member, index) => ({
                no: index + 1,
                fullName: member.fullName
            }))
        };
    }
}