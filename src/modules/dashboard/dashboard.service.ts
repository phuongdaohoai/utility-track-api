import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { log } from 'console';
import { CheckInOuts } from 'src/entities/check-in-outs.entity';
import { ServiceUsageHistories } from 'src/entities/service-usage-histories.entity';
import { Services } from 'src/entities/services.entity';
import { Repository } from 'typeorm';
import { DashboardGroupBy } from './enum/dashboard-group-by.enum';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(ServiceUsageHistories)
        private serviceUsageRepo: Repository<ServiceUsageHistories>,
    ) { }



    async getDashboardData(groupBy: DashboardGroupBy = DashboardGroupBy.MONTH,
        fromDate?: Date,
        toDate?: Date,) {
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
            this.getCheckInOutStats(),
            this.getRevenueStats(today, tomorrow),
            this.getResidentsCurrentlyCheckedIn(),
            this.getServiceUsageChartData(groupBy, fromDate, toDate),

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
    private async getCheckInOutStats() {
        const result = await this.serviceUsageRepo
            .createQueryBuilder('cio')
            .select(`
      COUNT(
        CASE 
          WHEN CAST(cio.check_in_time AS DATE) = CAST(GETDATE() AS DATE)
          THEN 1 
        END
      )
    `, 'TotalCheckInsToday')
            .addSelect(`
      COUNT(
        CASE 
          WHEN CAST(cio.check_out_time AS DATE) = CAST(GETDATE() AS DATE)
          THEN 1 
        END
      )
    `, 'TotalCheckOutsToday')
            .getRawOne();

        return {
            totalCheckInsToday: Number(result.TotalCheckInsToday) || 0,
            totalCheckOutsToday: Number(result.TotalCheckOutsToday) || 0,
        };
    }



    private async getRevenueStats(today: Date, tomorrow: Date) {
        const todayStr = today.toISOString();
        const tomorrowStr = tomorrow.toISOString();

        const result = await this.serviceUsageRepo.createQueryBuilder('suh')
            .leftJoin('suh.service', 'service')
            .select('COALESCE(SUM(service.price), 0)', 'TotalRevenueToday')
            .where('suh.check_in_time >= :today AND suh.check_in_time < :tomorrow')
            .setParameters({ today: todayStr, tomorrow: tomorrowStr })
            .getRawOne();

        return {
            totalRevenueToday: parseFloat(result.TotalRevenueToday) || 0,
        };
    }
    private async getResidentsCurrentlyCheckedIn() {
        const result = await this.serviceUsageRepo
            .createQueryBuilder('cio')
            .select('COUNT(DISTINCT cio.resident_id)', 'residentsCurrentlyInArea')
            .where('cio.check_out_time IS NULL')
            .andWhere('cio.resident_id IS NOT NULL')
            .andWhere('CAST(cio.check_in_time AS DATE) = CAST(GETDATE() AS DATE)')
            .getRawOne();

        return {
            residentsCurrentlyInArea: Number(result.residentsCurrentlyInArea) || 0,
        };
    }


    private async getServiceUsageChartData(
        groupBy: DashboardGroupBy = DashboardGroupBy.MONTH,
        fromDate?: Date,
        toDate?: Date,) {
        const datePartMap = {
            day: `
                    CONVERT(varchar(10), 
                        suh.check_in_time AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time', 
                        120
                    )  -- 120 = yyyy-mm-dd
                    `,

            month: `
                    FORMAT(
                        suh.check_in_time AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time',
                        'yyyy-MM'
                    )
                `,

            year: 'YEAR(suh.check_in_time)',

            quarter: `
                    CONCAT(
                    YEAR(suh.check_in_time),
                    '-Q',
                    DATEPART(QUARTER, suh.check_in_time)
                    )
                `,

            halfYear: `
                    CONCAT(
                    YEAR(suh.check_in_time),
                    '-H',
                    CASE 
                        WHEN MONTH(suh.check_in_time) <= 6 THEN 1
                        ELSE 2
                    END
                    )
                `,
        };



        // Chọn hàm grouping phù hợp với tham số groupBy
        const groupByClause = datePartMap[groupBy] || datePartMap.month;
        log(groupByClause);

        const query = this.serviceUsageRepo
            .createQueryBuilder('suh')
            .leftJoin('suh.service', 'service')
            .select(datePartMap[groupBy], 'Period')
            .addSelect('service.service_name', 'ServiceName')
            .addSelect('COUNT(suh.id)', 'UsageCount');


        if (fromDate) {
            // fromDate là Date object ở local (hoặc UTC? tùy bạn truyền vào)
            // Chuyển về UTC midnight
            const startOfDayUtc = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0));

            query.andWhere(`
      suh.check_in_time >= :fromDateUtc
    `, { fromDateUtc: startOfDayUtc });
        }

        if (toDate) {
            // toDate là Date object đại diện ngày cuối
            const endOfDay = new Date(Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999));

            query.andWhere(`
      suh.check_in_time <= :toDateUtc
    `, { toDateUtc: endOfDay });
        }

        query
            .groupBy(datePartMap[groupBy])
            .addGroupBy('service.service_name')
            .orderBy('Period', 'ASC')
            .addOrderBy('service.service_name', 'ASC');


        // Đối với SQL Server, cần dùng getRawMany()
        const rawData = await query.getRawMany();

        const structuredData = rawData.reduce((acc, item) => {
            // Ép buộc Period thành chuỗi YYYY-MM-DD để so sánh được
            const periodKey = item.Period

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
