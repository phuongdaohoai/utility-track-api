import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateCheckInDto } from "./dto/create-checkin.dto";
import { IsNull, Repository } from "typeorm";
import { Residents } from "src/entities/residents.entity";
import { ERROR_CODE } from "src/common/constants/error-code.constant";
import { ResidentCheckInDto } from "./dto/resident-check-in.dto";
import { ServiceUsageHistories } from "src/entities/service-usage-histories.entity";
import { ServiceUsageMethod } from "./dto/service-usage-method.dto";
import { Services } from 'src/entities/services.entity'
@Injectable()
export class CheckInService {
    constructor(

        @InjectRepository(ServiceUsageHistories)
        private serviceUsageRepo: Repository<ServiceUsageHistories>,

        @InjectRepository(Residents)
        private residentRepo: Repository<Residents>,

        @InjectRepository(Services)
        private serviceRepo: Repository<Services>,
    ) { }

    async createCheckIn(data: CreateCheckInDto, staffId: number) {
        const { guestName, guestPhone, serviceId } = data;

        // 1. Validate: Bắt buộc phải có SĐT để biết ai là ai
        if (!guestPhone) {
            throw new NotFoundException("Vui lòng nhập Số điện thoại để hệ thống tự động Check-in/Check-out!");
        }

        if (!staffId) {
            throw new NotFoundException(ERROR_CODE.STAFF_NOT_FOUND);
        }

        // 2. Lấy tên dịch vụ (để hiển thị cho đẹp)
        const serviceObj = await this.serviceRepo.findOne({ where: { id: serviceId } });
        const serviceNameDisplay = serviceObj ? serviceObj.serviceName : `Dịch vụ #${serviceId}`;

        // 3. TÌM KIẾM: Khách này có đang ở trong không
        const existingSession = await this.serviceUsageRepo.findOne({
            where: {
                phone: guestPhone,
                serviceId: serviceId,
                checkOutTime: IsNull() 
            }
        });

        // ---------------------------------------------------------
        //  TRƯỜNG HỢP A: ĐÃ CÓ -> THỰC HIỆN CHECK-OUT
        // ---------------------------------------------------------
        if (existingSession) {
            existingSession.checkOutTime = new Date();
            // existingSession.checkOutStaffId = staffId; // Nếu Pro có cột lưu người check-out

            const savedOut = await this.serviceUsageRepo.save(existingSession);


            return {
                checkinId: savedOut.id,
                status: 'CHECK_OUT', 
                message: `Đã Check-out cho khách: ${savedOut.additionalGuests}`,
                checkInTime: savedOut.checkInTime,
                checkOutTime: savedOut.checkOutTime,

                serviceName: serviceNameDisplay,
                representative: savedOut.additionalGuests,
                phoneNumber: savedOut.phone,
                type: 'GUEST'
            };
        }

        // ---------------------------------------------------------
        // TRƯỜNG HỢP B: CHƯA CÓ -> THỰC HIỆN CHECK-IN (Tạo mới)
        // ---------------------------------------------------------
        const newCheckIn = new ServiceUsageHistories();

        newCheckIn.staffId = staffId;
        newCheckIn.serviceId = serviceId;
        newCheckIn.method = ServiceUsageMethod.MANUAL;
        newCheckIn.checkInTime = new Date();

        // Info khách
        newCheckIn.residentId = null;
        newCheckIn.additionalGuests = guestName || 'Khách vãng lai';
        newCheckIn.phone = guestPhone;

        const savedIn = await this.serviceUsageRepo.save(newCheckIn);

        return {
            checkinId: savedIn.id,
            status: 'CHECK_IN',
            message: 'Check-in thành công!',
            checkInTime: savedIn.checkInTime,
            checkOutTime: null,

            serviceName: serviceNameDisplay,
            representative: guestName,
            phoneNumber: guestPhone,

            quantity: 1,
            members: [{ stt: 1, fullName: guestName }],
            type: 'GUEST',
            apartment: null
        };
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