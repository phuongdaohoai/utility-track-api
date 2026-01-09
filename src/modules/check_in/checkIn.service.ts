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
import { SystemService } from '../system_config/system_config.service';
import { FindResidentDto } from "./dto/find-resident.dto";
import { QueryHelper } from "src/common/helper/query.helper";
import { FilterCheckinDto } from "./dto/filter-checkin.dto";
import { PartialCheckoutDto } from "./dto/partial-check-out.dto";
import { StaffAttendances } from "src/entities/staff-attendances.entity";
import { FindStaffDto } from "./dto/find-staff.dto";
import { StaffCheckInDto } from "./dto/staff-check-in.dto";
import { Staffs } from "src/entities/staffs.entity";
@Injectable()
export class CheckInService {
    constructor(

        @InjectRepository(ServiceUsageHistories)
        private serviceUsageRepo: Repository<ServiceUsageHistories>,

        @InjectRepository(Residents)
        private residentRepo: Repository<Residents>,

        @InjectRepository(Services)
        private serviceRepo: Repository<Services>,

        @InjectRepository(StaffAttendances)
        private staffAttendancesRepo: Repository<StaffAttendances>,


        private readonly systemConfigService: SystemService,
    ) { }

    async getCurrentCheckIns(filter: FilterCheckinDto) {

        const qb = this.serviceUsageRepo
            .createQueryBuilder('serviceUsageHistories')
            .leftJoinAndSelect('serviceUsageHistories.resident', 'resident')
            .leftJoinAndSelect('resident.apartment', 'apartment')
            .leftJoinAndSelect('serviceUsageHistories.service', 'service')
            .where('serviceUsageHistories.checkOutTime IS NULL');

        if (filter.type === 'resident') {
            qb.andWhere('serviceUsageHistories.resident IS NOT NULL');
        }

        if (filter.type === 'guest') {
            qb.andWhere('serviceUsageHistories.resident IS NULL');
        }


        const result = await QueryHelper.apply(qb, filter, {
            alias: 'serviceUsageHistories',
            searchFields: [
                'resident.fullName',
                'apartment.building',
                'apartment.roomNumber',
                'serviceUsageHistories.additionalGuests',
                'service.serviceName',
                'resident.phone',
            ],
        });

        return {
            totalItem: result.totalItem,
            page: result.page,
            pageSize: result.pageSize,
            items: result.items.map(u => {
                const guests = parseGuests(u.additionalGuests);
                const hasResident = !!u.resident;

                return {
                    id: u.id,
                    displayName: hasResident
                        ? u.resident.fullName
                        : guests[0] ?? 'Khách',
                    room: hasResident && u.resident.apartment
                        ? `${u.resident.apartment.building} - ${u.resident.apartment.roomNumber}`
                        : '-',
                    phone: u.phone,
                    totalPeople: guests.length + (hasResident ? 1 : 0),
                    additionalGuests: hasResident ? guests : guests.slice(1),
                    serviceName: u.service.serviceName,
                    checkInTime: u.checkInTime,
                    method: u.method,
                };
            })
        };
    }

    async getCurrentCheckInsStaff(filter: FilterCheckinDto) {
        const qb = this.staffAttendancesRepo
            .createQueryBuilder('staffAttendances')
            .leftJoinAndSelect('staffAttendances.staff', 'staff')
            .where('staffAttendances.checkOutTime IS NULL');

        const result = await QueryHelper.apply(qb, filter, {
            alias: 'staffAttendances',
            searchFields: [
                'staff.fullName',
            ],
        });

        return {
            totalItem: result.totalItem,
            page: result.page,
            pageSize: result.pageSize,
            items: result.items.map(u => {
                return {
                    id: u.id,
                    displayName: u.staff.fullName,
                    phone: u.staff.phone,
                    checkInTime: u.checkInTime,
                    checkOutTime: u.checkOutTime,
                    method: u.deviceInfo,
                };
            })
        };
    }

    async getAllCurrentCheckIns() {
        const items = await this.serviceUsageRepo
            .createQueryBuilder('serviceUsageHistories')
            .leftJoinAndSelect('serviceUsageHistories.resident', 'resident')
            .leftJoinAndSelect('resident.apartment', 'apartment')
            .leftJoinAndSelect('serviceUsageHistories.service', 'service')
            .where('serviceUsageHistories.checkOutTime IS NULL')
            .orderBy('serviceUsageHistories.checkInTime', 'DESC')
            .getMany();;


        return items.map(u => {
            const guests = parseGuests(u.additionalGuests);
            const hasResident = !!u.resident;

            return {
                id: u.id,
                displayName: hasResident
                    ? u.resident.fullName
                    : guests[0] ?? 'Khách',
                room: hasResident && u.resident.apartment
                    ? `${u.resident.apartment.building} - ${u.resident.apartment.roomNumber}`
                    : '-',
                phone: u.phone,

                totalPeople: guests.length + (hasResident ? 1 : 0),
                additionalGuests: hasResident ? guests : guests.slice(1),
                serviceName: u.service.serviceName,
                checkInTime: u.checkInTime,
                method: u.method,
            };
        })

    }

    async currentCheckOuts(checkinId: number) {
        const usage = await this.serviceUsageRepo.findOne({
            where: { id: checkinId, checkOutTime: IsNull() },
            relations: ['resident', 'service', 'resident.apartment'],
        });

        if (!usage) {
            throw new NotFoundException(ERROR_CODE.CHECKIN_NOT_FOUND, "Không tìm thấy thông tin check-in");
        }

        usage.checkOutTime = new Date();
        return await this.serviceUsageRepo.save(usage);
    }

    async createCheckIn(data: CreateCheckInDto, staffId: number) {

        await this.systemConfigService.validateAccess('MANUAL');

        const allowGuest = await this.systemConfigService.getConfigValue('GUEST_CHECKIN');

        if (allowGuest === '0') {
            throw new BadRequestException();
        }
        const { guestName, guestPhone, serviceId } = data;

        // 1. Validate: Bắt buộc phải có SĐT để biết ai là ai
        if (!guestPhone) {
            throw new NotFoundException();
        }

        if (!staffId) {
            throw new NotFoundException(ERROR_CODE.STAFF_NOT_FOUND);
        }

        // 2. Lấy tên dịch vụ (để hiển thị cho đẹp)
        const serviceObj = await this.serviceRepo.findOne({ where: { id: serviceId } });
        const serviceNameDisplay = serviceObj ? serviceObj.serviceName : `Dịch vụ #${serviceId}`;

        const priceAtUsage = Number(serviceObj?.price) || 0;

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
        const guestNameArr = guestName.split(',').map(name => name.trim()).filter(Boolean);
        const totalPeople = guestNameArr.length;
        const totalAmount = priceAtUsage * totalPeople;

        const additionalGuestsArr = guestNameArr?.length > 1 ? guestNameArr.slice(1) : [];


        const newCheckIn = new ServiceUsageHistories();

        newCheckIn.staffId = staffId;
        newCheckIn.serviceId = serviceId;
        newCheckIn.method = ServiceUsageMethod.MANUAL;
        newCheckIn.checkInTime = new Date();
        newCheckIn.phone = guestPhone;
        newCheckIn.additionalGuests = guestNameArr.join(",");

        // Info khách
        newCheckIn.priceAtUsage = priceAtUsage;
        newCheckIn.totalAmount = totalAmount;
        newCheckIn.paymentStatus = 1;


        const savedIn = await this.serviceUsageRepo.save(newCheckIn);

        const members = [
            { stt: 1, fullName: guestNameArr[0] },
            ...additionalGuestsArr.map((name, idx) => ({
                stt: idx + 2,
                fullName: name,
            })),
        ];

        return {
            checkinId: savedIn.id,
            status: 'CHECK_IN',
            message: 'Check-in thành công!',
            checkInTime: savedIn.checkInTime,
            checkOutTime: null,
            priceAtUsage,
            totalAmount,

            serviceName: serviceNameDisplay,
            representative: guestNameArr[0],
            phoneNumber: guestPhone,

            additionalGuests: additionalGuestsArr,
            totalPeople: totalPeople,
            members,

            type: 'GUEST',
            apartment: null
        };
    }

    async findResident(dto: FindResidentDto): Promise<Residents> {
        if (dto.qrCode) {
            const resident = await this.residentRepo.findOne({
                where: { qrCode: dto.qrCode },
                relations: ['apartment'],
            });
            if (resident) return resident;
        }

        if (dto.faceDescriptor && dto.faceDescriptor.length === 128) {
            const residents = await this.residentRepo.find({ relations: ['apartment'] });
            for (const res of residents) {
                if (!res.faceIdData) continue;
                try {
                    const stored = JSON.parse(res.faceIdData.toString());
                    const distance = this.euclideanDistance(dto.faceDescriptor, stored);
                    if (distance < 0.6) return res;
                } catch (e) { }
            }
        }

        throw new BadRequestException(ERROR_CODE.CHECKIN_INVALID_RESIDENT, 'Cư dân không hợp lệ! Vui lòng thử lại.');
    }

    async findStaff(dto: FindStaffDto): Promise<Staffs> {
        if (dto.qrCode) {
            const staff = await this.staffRepo.findOne({
                where: { qrCode: dto.qrCode },
            });
            if (staff) return staff;
        }
        throw new BadRequestException(ERROR_CODE.STAFF_NOT_FOUND, 'Nhân viên không hợp lệ! Vui lòng thử lại.');
    }

    async partialCheckout(checkinId: number, dto: PartialCheckoutDto) {
        if (!dto.guestsToCheckout || dto.guestsToCheckout.length === 0) {
            throw new BadRequestException(ERROR_CODE.CHECKIN_INVALID_GUESTS, 'Chưa chọn người cần checkout');
        }

        const usage = await this.serviceUsageRepo.findOne({
            where: { id: checkinId, checkOutTime: IsNull() },
            relations: ['resident'],
        })

        if (!usage) {
            throw new NotFoundException(ERROR_CODE.CHECKIN_NOT_FOUND, "Không tìm thấy thông tin check-in")
        }

        const guests = parseGuests(usage.additionalGuests);

        const remainingGuests = guests.filter(g => !dto.guestsToCheckout.includes(g));

        usage.additionalGuests = remainingGuests.length ? remainingGuests.join(',') : null;

        await this.serviceUsageRepo.save(usage);

        return usage;
    }

    private euclideanDistance(a: number[], b: number[]): number {
        return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
    }

    async residentCheckInOrOut(dto: ResidentCheckInDto) {
        const method = dto.qrCode ? ServiceUsageMethod.QR_CODE : ServiceUsageMethod.FACE_ID;
        const methodKey = method === ServiceUsageMethod.QR_CODE ? 'QR' : 'FACEID';
        await this.systemConfigService.validateAccess(methodKey);

        if (!dto.qrCode && !dto.faceDescriptor) {
            throw new BadRequestException(ERROR_CODE.CHECKIN_INVALID_RESIDENT, 'Cư dân không hợp lệ! Vui lòng thử lại.');
        }
        const data: FindResidentDto = {
            qrCode: dto.qrCode,
            faceDescriptor: dto.faceDescriptor
        }
        const resident = await this.findResident(data);

        const serviceObj = await this.serviceRepo.findOne({ where: { id: dto.serviceId } });
        if (!serviceObj) throw new NotFoundException(ERROR_CODE.SERVICE_NOT_FOUND);

        const activeUsage = await this.serviceUsageRepo.findOne({
            where: {
                resident: { id: resident.id },
                service: { id: dto.serviceId },
                checkOutTime: IsNull(),
            },
            order: { checkInTime: 'DESC' },
        });

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
                avatar: resident.avatar,
                additionalGuests: dto.additionalGuests || [],
                duration_minutes: durationMinutes,
            };
        }

        const priceAtUsage = Number(serviceObj?.price) || 0;
        const guestCount = dto.additionalGuests ? dto.additionalGuests.length : 0;
        const totalPeople = guestCount + 1;
        const totalAmount = priceAtUsage * totalPeople;

        // Đây là lần quét đầu → CHECK-IN
        const newUsage = this.serviceUsageRepo.create({
            service: { id: dto.serviceId },
            resident: { id: resident.id },
            checkInTime: new Date(),
            checkOutTime: null,
            method: method,
            additionalGuests: dto.additionalGuests ? dto.additionalGuests.join(', ') : null,
            phone: resident.phone,

            priceAtUsage: priceAtUsage,
            totalAmount: totalAmount,
            paymentStatus: 0,
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
            additionalGuests: dto.additionalGuests || [],
            totalPeople: totalPeople,
            priceAtUsage: priceAtUsage,
            totalAmount: totalAmount,
        };
    }
}
function parseGuests(guests?: string | null): string[] {
    if (!guests) return [];
    return guests
        .split(',')
        .map(g => g.trim())
        .filter(Boolean);
}

