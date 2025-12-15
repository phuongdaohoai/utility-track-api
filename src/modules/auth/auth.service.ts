import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from 'src/entities/entities/roles.entity';
import { Staff } from 'src/entities/entities/staff.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { JwtAuthService } from './jwt-auth.service';
import { PasswordHelper } from 'src/helper/password.helper';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtAuthService: JwtAuthService,

        @InjectRepository(Staff)
        private repoStaff: Repository<Staff>,

        @InjectRepository(Roles)
        private roleRepo: Repository<Roles>


    ) { }
    async login(body: LoginDto) {
        const { email, password } = body;

        // 1. Tìm user
        const user = await this.findUserByEmail(email);
        if (!user) {
            throw new BadRequestException("Sai tài khoản hoặc mật khẩu");
        }

        // 2. Verify password
        const match = await PasswordHelper.verifyPassword(password, user.passwordHash);
        if (!match) {
            throw new BadRequestException("Sai tài khoản hoặc mật khẩu");
        }

        // 3. Check role
        const roleId = user.roleId ?? 0;
        if (roleId === 0) {
            throw new UnauthorizedException("Bạn không có quyền truy cập");
        }

        const role = await this.findRoleByRoleId(roleId);
        if (!role) {
            throw new BadRequestException("Không tồn tại quyền này");
        }

        // 4. Lấy permissions
        const permissions = await this.getPermissions(roleId);
        if (!permissions) {
            throw new BadRequestException("Không tồn tại quyền này");
        }

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
    async findUserByEmail(email: string) {
        return this.repoStaff.findOne({
            where: {
                email: email,
            },
            select: {
                staffId: true,
                fullName: true,
                phone: true,
                email: true,
                passwordHash: true,
                roleId: true,
            },
        });
    }

    async findRoleByRoleId(roleId: number) {
        return this.roleRepo.findOne({
            where: {
                roleId: roleId,

            },
            select: {
                roleId: true,
                roleName: true,
            },
        });
    }

    async getPermissions(roleId: number): Promise<string[]> {
        const role = await this.roleRepo.findOne({
            where: { roleId },
            relations: ["permissions"],
        });

        if (!role) return [];

        // Tạo permission dạng MODULE.ACTION
        return role.permissions.map(p => `${p.module}.${p.action}`);
    }


}
