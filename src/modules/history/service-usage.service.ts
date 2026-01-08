import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FillerHistoryDto } from "./dto/filter-history.dto";
import { Repository } from "typeorm";
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";
import { ERROR_CODE } from "src/common/constants/error-code.constant";
import { QueryBuilderHelper } from "src/common/helper/query-builder.helper";
import { QueryHelper } from "src/common/helper/query.helper";

@Injectable()
export default class ServiceUsageService {
    constructor(
        @InjectRepository(ServiceUsageHistories)
        private repo: Repository<ServiceUsageHistories>,
    ) { }

    async getHistory(filter: FillerHistoryDto) {
        const query = this.repo.createQueryBuilder("history")
            .leftJoin("history.resident", "resident")
            .leftJoin("history.service", "service")
            .leftJoin("history.staff", "staff")
            .leftJoin("resident.apartment", "apartment")
            .select([
                "history.id",
                "history.usageTime",
                "history.additionalGuests",
                "history.method",
                "history.checkInTime",
                "history.checkOutTime",
                "resident.id",
                "resident.fullName",
                "resident.phone",
                "resident.email",
                "apartment.id",
                "apartment.building",
                "apartment.roomNumber",
                "apartment.floorNumber",
                "service.id",
                "service.serviceName",
                "service.price",
                "service.capacity",
                "staff.id",
                "staff.fullName"
            ])
            .orderBy("history.usageTime", "DESC");

        if (filter.type === 'resident') {
            query.andWhere("history.resident IS NOT NULL");
        }
        if (filter.type === 'guest') {
            query.andWhere("history.resident IS NULL");

        }

        const result = await QueryHelper.apply(query, filter, {
            alias: 'history',
            searchFields: [
                'resident.fullName',
                'apartment.building',
                'apartment.roomNumber',
                'history.additionalGuests',
                'service.serviceName',
                'resident.phone',
            ],

        })
        // 🔹 Map dữ liệu cho FE cũ
        const mappedItems = result.items.map(item => ({
            id: item.id,
            quantity: 1 + (item.additionalGuests ? item.additionalGuests.split(',').filter(Boolean).length : 0),
            additionalGuests: item.additionalGuests,
            checkInOut: {
                checkInTime: item.checkInTime,
                checkOutTime: item.checkOutTime,
                method: item.method,
            },
            resident: item.resident ? { fullName: item.resident.fullName, phone: item.resident.phone } : undefined,
            service: item.service,
            staff: item.staff,
        }));
        const totalPages = Math.ceil(result.totalItem / result.pageSize);

        return {
            meta: {
                total: result.totalItem,
                limit: result.pageSize,
                page: result.page,
                totalPages: totalPages,
            },
            data: mappedItems
        };
    }


    async getDetail(id: number) {
        const history = await this.repo.findOne({
            where: { id: id },
            relations: {
                resident: {
                    apartment: true
                },
                service: true,
                staff: true,
            },
        });
        if (!history) {
            throw new NotFoundException(ERROR_CODE.HISTORY_NOT_FOUND)
        }
        const guests = parseGuests(history.additionalGuests)
        let displayName = ''
        let total = 0
        let remainingNames = ''
        if (history.resident) {
            displayName = history.resident.fullName
            remainingNames = guests.join(', ');
            total = 1 + guests.length
        } else {
            displayName = guests.length > 0 ? guests[0] : 'Khách vãng lai'
            remainingNames = guests.slice(1).join(', ');
            total = guests.length > 0 ? guests.length : 1
        }
        return {
            id: history.id,
            usageTime: history.usageTime,
            item: {
                displayName: displayName,
                remainingNames: [
                    remainingNames
                ],
                totalGuests: total,
                checkInTime: history.checkInTime,
                checkOutTime: history.checkOutTime,
                method: history.method,
                phone: history.resident?.phone || history.phone,
            },
            apartment: history.resident?.apartment
                ? `${history.resident.apartment.building} - ${history.resident.apartment.roomNumber}`
                : null,
            service: {
                id: history.service?.id,
                serviceName: history.service.serviceName || 'Dịch vụ không xác định',
                price: history.service.price || 0,
                capacity: history.service.capacity,
            },
            staff: history.staff ? {
                id: history.staff.id,
                fullName: history.staff.fullName,
            } : null
        };


        function parseGuests(guests?: string | null): string[] {
            if (!guests) return [];
            return guests
                .split(',')
                .map(g => g.trim())
                .filter(Boolean);
        }
    }
}