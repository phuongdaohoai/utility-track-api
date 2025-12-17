import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateCheckInAuTo } from "./dto/check-in-auto.dto";
import { CreateCheckInDto } from "./dto/create-checkin.dto";
import { Repository } from "typeorm";
import { CheckInOuts } from "src/entities/check-in-outs.entity";
import { Residents } from "src/entities/residents.entity";

@Injectable()
export class CheckInService {
    constructor(
        @InjectRepository(CheckInOuts)
        private repo: Repository<CheckInOuts>,
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
            checkin.staff = null;
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

            // Trả về để xem cho vui thôi chứ trong DB không lưu SĐT khách nhé
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
}