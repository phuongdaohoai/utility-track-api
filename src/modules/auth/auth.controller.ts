import { BadRequestException, Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { PasswordHelper } from 'src/helper/password.helper';
import { JwtAuthService } from './jwt-auth.service';
import { AuthService } from './auth.service';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @ApiTags('Auth')
    @Post('login')
    async login(@Body() body: LoginDto) {
        return this.authService.login(body);
    }

}
