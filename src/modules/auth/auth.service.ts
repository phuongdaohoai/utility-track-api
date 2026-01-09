import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from 'src/entities/roles.entity';
import { Between, IsNull, Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { JwtAuthService } from './jwt-auth.service';
import { PasswordHelper } from 'src/common/helper/password.helper';
import { Staffs } from 'src/entities/staffs.entity';
import { ERROR_CODE } from 'src/common/constants/error-code.constant';
import { StaffAttendances } from 'src/entities/staff-attendances.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtAuthService: JwtAuthService,

        @InjectRepository(Staffs)
        private repoStaff: Repository<Staffs>,

        @InjectRepository(Roles)
        private roleRepo: Repository<Roles>,

        @InjectRepository(StaffAttendances)
        private staffAttendanceRepo: Repository<StaffAttendances>,

    ) { }
    async login(body: LoginDto) {
        const { email, password, qrCode } = body;

        let user: Staffs | null = null;
        let loginMethod = "";
        if (qrCode) {
            user = await this.verifyQrCode(qrCode);
            loginMethod = "QR Code";
        } else if (email && password) {
            // 1. Tìm user
            user = await this.findUserByEmail(email);
            if (!user) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.AUTH_INVALID_CREDENTIALS,
                    message: "Sai tài khoản hoặc mật khẩu",
                });
            }

            // 2. Verify password
            const match = await PasswordHelper.verifyPassword(password, user.passwordHash);
            if (!match) {
                throw new BadRequestException({
                    errorCode: ERROR_CODE.AUTH_INVALID_PASSWORD,
                    message: "Sai mật khẩu",
                });
            }
            loginMethod = "Email";
        } else {
            throw new BadRequestException({ errorCode: ERROR_CODE.AUTH_INVALID_CREDENTIALS, message: "Sai tài khoản hoặc mật khẩu" })
        }
        return this.handleUserLogin(user, loginMethod);

    }
    private async verifyQrCode(qrCode: string) {
        const staff = await this.repoStaff.findOne({
            where: { qrCode: qrCode },
            relations: {
                role: true,
            }
        });
        if (!staff) {
            throw new BadRequestException({
                errorCode: ERROR_CODE.STAFF_NOT_FOUND,
                message: "Không tìm thấy nhân viên",
            });
        }
        return staff
    }
    private async handleUserLogin(user: Staffs, loginMethod: string) {
        // 3. Check role
        const roleId = user.role.id ?? 0;
        if (roleId === 0) {
            throw new UnauthorizedException({
                errorCode: ERROR_CODE.AUTH_NO_ROLE_ASSIGNED,
                message: "User không có role",
            });
        }

        const role = await this.findRoleByRoleId(roleId);
        if (!role) {
            throw new BadRequestException({
                errorCode: ERROR_CODE.AUTH_ROLE_NOT_FOUND,
                message: "Role không tồn tại",
            });
        }

        // 4. Lấy permissions
        const permissions = await this.getPermissions(roleId);
        if (!permissions) {
            throw new BadRequestException({
                errorCode: ERROR_CODE.AUTH_NO_PERMISSIONS,
                message: "Không có quyền truy cập",
            });
        }

        await this.trackAttendance(user.id, loginMethod);

        // 5. Generate token
        const accessToken = this.jwtAuthService.generateToken(
            user,
            role.roleName,
            permissions,
        );

        return {
            accessToken,
        };
    }
    private async trackAttendance(staffId: number, loginMethod: string) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Tìm bản ghi của hôm nay MÀ CHƯA CHECK-OUT (checkOutTime is null)
        const openAttendance = await this.staffAttendanceRepo.findOne({
            where: {
                staffId: staffId,
                checkInTime: Between(todayStart, todayEnd),
                checkOutTime: IsNull() 
            }
        });

        // Nếu không có bản ghi nào đang "mở", thì mới tạo bản ghi check-in mới
        if (!openAttendance) {
            const newAttendance = this.staffAttendanceRepo.create({
                staffId: staffId,
                checkInTime: new Date(),
                deviceInfo: loginMethod,
                note: `Check-in lúc login (${loginMethod})`,
            });
            await this.staffAttendanceRepo.save(newAttendance);
        }
    }
    async findUserByEmail(email: string) {
        return this.repoStaff.findOne({
            where: {
                email: email,
            },
            relations: {
                role: true,
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                passwordHash: true,
                avatar: true,
                role: {
                    id: true,
                },
            },
        });
    }

    async findRoleByRoleId(roleId: number) {
        return this.roleRepo.findOne({
            where: {
                id: roleId,

            },
            select: {
                id: true,
                roleName: true,
            },
        });
    }

    async getPermissions(roleId: number): Promise<string[]> {
        const role = await this.roleRepo.findOne({
            where: { id: roleId },
            relations: ["permissions"],
        });

        if (!role) return [];

        // Tạo permission dạng MODULE.ACTION
        return role.permissions.map(p => `${p.module}.${p.action}`);
    }


}
