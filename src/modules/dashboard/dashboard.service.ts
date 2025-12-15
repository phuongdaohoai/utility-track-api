import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { log } from 'console';
import { CheckInOuts } from 'src/entities/check-in-outs.entity';
import { ServiceUsageHistories } from 'src/entities/service-usage-histories.entity';
import { Services } from 'src/entities/services.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(CheckInOuts)
        private checkInOutRepo: Repository<CheckInOuts>,
        @InjectRepository(ServiceUsageHistories)
        private serviceUsageRepo: Repository<ServiceUsageHistories>,
    ) { }

    async getDashboardData(groupBy: 'year' | 'month' | 'day') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            checkInOutStats,
            revenueStats,
            currentlyInStats,
            usageChartData
        ] = await Promise.all([
            this.getCheckInOutStats(today, tomorrow),
            this.getRevenueStats(today, tomorrow),
            this.getResidentsCurrentlyCheckedIn(),
            this.getServiceUsageChartData(groupBy)

        ]);
        return {
            totalCheckInsToday: checkInOutStats.totalCheckInsToday,
            totalCheckOutsToday: checkInOutStats.totalCheckOutsToday,
            totalRevenueToday: revenueStats.totalRevenueToday,
            residentsCurrentlyInArea: currentlyInStats.residentsCurrentlyInArea,

            //Chart Data
            serviceUsageChart: usageChartData,
        }

    }
    private async getCheckInOutStats(today: Date, tomorrow: Date) {
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const result = await this.checkInOutRepo.createQueryBuilder('cio')
            .select(`COALESCE(SUM(CASE WHEN cio.check_in_time >= :today AND cio.check_in_time < :tomorrow THEN 1 ELSE 0 END), 0)`, 'TotalCheckInsToday')
            .addSelect(`COALESCE(SUM(CASE WHEN cio.check_out_time >= :today AND cio.check_out_time < :tomorrow THEN 1 ELSE 0 END), 0)`, 'TotalCheckOutsToday')
            .where(`(cio.check_in_time >= :today AND cio.check_in_time < :tomorrow) OR (cio.check_out_time >= :today AND cio.check_out_time < :tomorrow)`)
            .setParameters({ today: todayStr, tomorrow: tomorrowStr })
            .getRawOne();

        return {
            totalCheckInsToday: parseInt(result.TotalCheckInsToday) || 0,
            totalCheckOutsToday: parseInt(result.TotalCheckOutsToday) || 0
        }
    }

    private async getRevenueStats(today: Date, tomorrow: Date) {
        const todayStr = today.toISOString();
        const tomorrowStr = tomorrow.toISOString();

        const result = await this.serviceUsageRepo.createQueryBuilder('suh')
            .leftJoin('suh.service', 'service')
            .select('COALESCE(SUM(service.price), 0)', 'TotalRevenueToday')
            .where('suh.usage_time >= :today AND suh.usage_time < :tomorrow')
            .setParameters({ today: todayStr, tomorrow: tomorrowStr })
            .getRawOne();

        return {
            totalRevenueToday: parseFloat(result.TotalRevenueToday) || 0,
        };
    }

    private async getResidentsCurrentlyCheckedIn() {
        const result = await this.checkInOutRepo.createQueryBuilder('cio')
            .select('COUNT(DISTINCT cio.resident_id)', 'residentsCurrentlyInArea')
            .where('cio.check_out_time IS NULL')
            .andWhere('cio.resident_id IS NOT NULL')
            .getRawOne();

        return {
            residentsCurrentlyInArea: parseInt(result.residentsCurrentlyInArea) || 0,
        };
    }

    private async getServiceUsageChartData(groupBy: 'year' | 'month' | 'day') {
        const datePart = {
            year: 'YEAR(suh.usage_time)',
            month: 'FORMAT(suh.usage_time, \'yyyy-MM\')',
            day: 'CAST(suh.usage_time AS DATE)',
        };

        // Chọn hàm grouping phù hợp với tham số groupBy
        const groupByClause = datePart[groupBy] || datePart.month;
        log(groupByClause);

        // Sử dụng Query Builder (và SQL Expression cho GROUP BY)
        const query = this.serviceUsageRepo.createQueryBuilder('suh')
            .leftJoin('suh.service', 'service')
            .select(groupByClause, 'Period')
            .addSelect('service.service_name', 'ServiceName') 
            .addSelect('COUNT(suh.id)', 'UsageCount') 
            .groupBy(groupByClause)
            .addGroupBy('service.service_name')
            .orderBy('Period', 'ASC')
            .addOrderBy('service.service_name', 'ASC');

        // Đối với SQL Server, cần dùng getRawMany()
        const rawData = await query.getRawMany();

        const structuredData = rawData.reduce((acc, item) => {
            // Ép buộc Period thành chuỗi YYYY-MM-DD để so sánh được
            const periodKey = item.Period instanceof Date
                ? item.Period.toISOString().substring(0, 10) // Lấy YYYY-MM-DD
                : String(item.Period);

            const serviceName = item.ServiceName;
            const usageCount = parseInt(item.UsageCount);

            let periodEntry = acc.find(e => e.Period === periodKey);

            if (!periodEntry) {
                periodEntry = { Period: periodKey };
                acc.push(periodEntry);
            }

            periodEntry[serviceName] = usageCount;
            return acc;
        }, []);

        return structuredData;
    }

}
