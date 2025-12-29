import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateCheckInAuTo } from "./dto/check-in-auto.dto";
import { CreateCheckInDto } from "./dto/create-checkin.dto";
import { IsNull, Repository } from "typeorm";
import { CheckInOuts } from "src/entities/check-in-outs.entity";
import { Residents } from "src/entities/residents.entity";
import { ERROR_CODE } from "src/common/constants/error-code.constant";
import { ResidentCheckInDto } from "./dto/resident-check-in.dto";
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";
import { ServiceUsageMethod } from "./dto/service-usage-method.dto";
@Injectable()
export class CheckInService {
    constructor(
        @InjectRepository(CheckInOuts)
        private repo: Repository<CheckInOuts>,

        @InjectRepository(ServiceUsageHistories)
        private serviceUsageRepo: Repository<ServiceUsageHistories>,

        @InjectRepository(Residents)
        private residentRepo: Repository<Residents>,
    ) { }

    async createCheckIn(data: CreateCheckInDto, staffId: number | null) {
        const { residentId, guestName, guestPhone, checkInMethod } = data;

        const checkin = new CheckInOuts();

        // Xử lý Staff
        if (staffId) {
            checkin.staff = { id: staffId } as any;
        } else {
            throw new NotFoundException(ERROR_CODE.STAFF_NOT_FOUND)
        }

        checkin.method = checkInMethod || 'Manual';
        checkin.checkInTime = new Date();

        let residentData: Residents | null = null;

        // Xử lý logic phân luồng
        if (residentId) {
            // --- CƯ DÂN ---
            const resident = await this.residentRepo.findOne({
                where: { id: Number(residentId) },
                relations: ["apartment"]
            });
            if (!resident) {
                throw new NotFoundException(`Cư dân (ID: ${residentId}) không tồn tại!`);
            }
            checkin.resident = resident;
            residentData = resident;
        } else {
            // --- KHÁCH VÃNG LAI ---
            checkin.guestName = guestName || null;
        }

        // Lưu vào DB
        const savedCheckIn = await this.repo.save(checkin);

        return {
            checkinId: savedCheckIn.id,
            checkinTime: savedCheckIn.checkInTime,
            method: savedCheckIn.method,
            representative: residentData ? residentData.fullName : guestName,

            phoneNumber: residentData ? residentData.phone : guestPhone,

            apartment: residentData?.apartment ? {
                id: residentData.apartment.id,
                name: residentData.apartment.building,
                block: residentData.apartment.roomNumber
            } : null,
            type: residentData ? 'RESIDENT' : 'GUEST'
        }
    }

    async autoCheckIn(data: CreateCheckInAuTo, staffId: number | null) {
        const { code } = data;

        const resident = await this.residentRepo.findOne({
            where: [
                { citizenCard: code },
                { qrCode: code }
            ]
        });

        if (!resident) {
            throw new NotFoundException(`Mã thẻ/QR "${code}" không tồn tại trong hệ thống!`);
        }

        let method = 'Manual';
        if (resident.citizenCard === code) method = 'Card';
        else if (resident.qrCode === code) method = 'QR';

        const manualDTO: CreateCheckInDto = {
            residentId: resident.id.toString(),
            checkInMethod: method,
            guestName: undefined,
            guestPhone: undefined,
        };

        return await this.createCheckIn(manualDTO, staffId);
    }

    async findResident(qrCode?: string, faceDescriptor?: number[]): Promise<Residents> {
        if (qrCode) {
            const resident = await this.residentRepo.findOne({
                where: { qrCode: qrCode },
                relations: ['apartment'],
            });
            if (resident) return resident;
        }

        if (faceDescriptor && faceDescriptor.length === 128) {
            const residents = await this.residentRepo.find({ relations: ['apartment'] });
            for (const res of residents) {
                if (!res.faceIdData) continue;
                try {
                    const stored = JSON.parse(res.faceIdData.toString());
                    const distance = this.euclideanDistance(faceDescriptor, stored);
                    if (distance < 0.6) return res;
                } catch (e) { }
            }
        }

        throw new BadRequestException(ERROR_CODE.CHECKIN_INVALID_RESIDENT, 'Cư dân không hợp lệ! Vui lòng thử lại.');
    }

    private euclideanDistance(a: number[], b: number[]): number {
        return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
    }
    async residentCheckInOrOut(dto: ResidentCheckInDto) {
        if (!dto.qrCode && !dto.faceDescriptor) {
            throw new BadRequestException(ERROR_CODE.CHECKIN_INVALID_RESIDENT, 'Cư dân không hợp lệ! Vui lòng thử lại.');
        }

        const resident = await this.findResident(dto.qrCode, dto.faceDescriptor);

        const method = dto.qrCode ? ServiceUsageMethod.QR_CODE : ServiceUsageMethod.FACE_ID;

        const activeUsage = await this.serviceUsageRepo.findOne({
            where: {
                resident: { id: resident.id },
                service: { id: dto.serviceId },
                checkOutTime: IsNull(),
            },
            order: { checkInTime: 'DESC' },
        });
        console.log('Active Usage:', activeUsage);

        if (activeUsage) {
            // Đây là lần quét thứ 2 → CHECK-OUT
            activeUsage.checkOutTime = new Date();
            await this.serviceUsageRepo.save(activeUsage);

            const durationMinutes = Math.round(
                (activeUsage.checkOutTime.getTime() - activeUsage.checkInTime.getTime()) / 60000,
            );

            return {
                action: 'checkout',
                message: 'Checkout thành công. Cảm ơn quý cư dân đã sử dụng dịch vụ!',
                full_name: resident.fullName,
                apartment: resident.apartment
                    ? `${resident.apartment.building} - ${resident.apartment.roomNumber}`
                    : null,
                duration_minutes: durationMinutes,
            };
        }

        // Đây là lần quét đầu → CHECK-IN
        const newUsage = this.serviceUsageRepo.create({
            service: { id: dto.serviceId },
            resident: { id: resident.id },
            checkInTime: new Date(),
            checkOutTime: null,
            method: method,
            additionalGuests: null,
        });

        await this.serviceUsageRepo.save(newUsage);

        return {
            action: 'checkin',
            message: 'Check-in thành công. Chào mừng quý cư dân sử dụng dịch vụ!',
            full_name: resident.fullName,
            apartment: resident.apartment
                ? `${resident.apartment.building} - ${resident.apartment.roomNumber}`
                : null,
            avatar: resident.avatar,
        };
    }
}   