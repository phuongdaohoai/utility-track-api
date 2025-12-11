import { BadRequestException, Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { PasswordHelper } from 'src/helper/password.helper';
import { JwtAuthService } from './jwt-auth.service';
import { AuthService } from './auth.service';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly jwtAuthService: JwtAuthService,
        private readonly authService: AuthService
    ) { }

    @ApiTags('Auth')
    @Post('login')
    async login(@Body() body: LoginDto) {
        const { email, password } = body;

        const user = await this.authService.findUserByEmail(email);
        if (!user) throw new BadRequestException("Sai tài khoản hoặc mật khẩu");

        const match = await PasswordHelper.verifyPassword(password, user.passwordHash);
        if (!match) throw new BadRequestException("Sai tài khoản hoặc mật khẩu");

        const roleId: number = user.roleId ?? 0;
        if (roleId == 0) throw new UnauthorizedException("Bạn không có quyền truy cập");

        const role = await this.authService.findRoleByRoleId(roleId);
        if (!role) throw new BadRequestException("Không tồn tại quyền này");

        const permissions = await this.authService.getPermissions(roleId);
        if(!permissions) throw new BadRequestException("Không tồn tại quyền này");

        return {
            asscessToken: this.jwtAuthService.generateToken(user, role.roleName,permissions),
        };
    }

}
