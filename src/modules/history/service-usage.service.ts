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
                "history.phone",
                "history.priceAtUsage",
                "history.totalAmount",
                "history.paymentStatus",
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
        const mappedItems = result.items.map(item => {
            const allGuests = parseGuests(item.additionalGuests, false); // Lấy tất cả guests để tính lịch sử gốc
            return {
                id: item.id,
                quantity: allGuests.length,
                additionalGuests: allGuests.map(g => g.name).join(', '), // Return comma-separated string để FE render dễ, giữ lịch sử gốc
                price: item.priceAtUsage,
                total: item.totalAmount,
                checkInOut: {
                    checkInTime: item.checkInTime,
                    checkOutTime: item.checkOutTime,
                    method: item.method,
                },
                resident: item.resident ? { fullName: item.resident.fullName, phone: item.resident.phone } : undefined,
                service: item.service,
                staff: item.staff,
            };
        });
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
        const allGuests = parseGuests(history.additionalGuests, false); // Lấy tất cả guests để tính lịch sử
        const activeGuests = allGuests.filter(g => g.checkedOutAt === null);
        let displayName = ''
        let total = 0
        let remainingNames = ''
        if (history.resident) {
            displayName = history.resident.fullName
            remainingNames = allGuests.map(g => g.name).join(', '); // Sử dụng allGuests để giữ lịch sử gốc
            total = 1 + allGuests.length
        } else {
            displayName = allGuests.length > 0 ? allGuests[0].name : 'Khách vãng lai'
            remainingNames = allGuests.slice(1).map(g => g.name).join(', ');
            total = allGuests.length > 0 ? allGuests.length : 1
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
                totalAmount: history.totalAmount,
                priceAtUsage: history.priceAtUsage,
                method: history.method,
                phone: history.resident?.phone || history.phone,
            },
            apartment: history.resident?.apartment
                ? `${history.resident.apartment.building} - ${history.resident.apartment.roomNumber}`
                : null,
            service: {
                id: history.service?.id,
                serviceName: history.service.serviceName || 'Dịch vụ không xác định',
                capacity: history.service.capacity,
            },
            staff: history.staff ? {
                id: history.staff.id,
                fullName: history.staff.fullName,
            } : null
        };
    }
}

// Hàm parse cập nhật: Parse JSON, hỗ trợ onlyActive và fallback data cũ
function parseGuests(guests?: string | null, onlyActive: boolean = true): { name: string, checkedOutAt: Date | null }[] {
    if (!guests) return [];
    try {
        const parsed = JSON.parse(guests);
        if (!Array.isArray(parsed)) return [];
        if (onlyActive) {
            return parsed.filter(g => g.checkedOutAt === null);
        }
        return parsed;
    } catch (e) {
        // Fallback cho data cũ (comma-separated): Convert sang JSON format
        const oldGuests = guests.split(',').map(g => g.trim()).filter(Boolean);
        return oldGuests.map(name => ({ name, checkedOutAt: null }));
    }
}