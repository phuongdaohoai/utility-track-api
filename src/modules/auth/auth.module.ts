import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthService } from './jwt-auth.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from './guards/permissions.guard';
import { Staffs } from 'src/entities/staffs.entity';
import { Roles } from 'src/entities/roles.entity';
import { Permissions } from 'src/entities/permissions.entity';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: Number(process.env.JWT_EXPIRE_MINUTES ?? 60) * 60,
                issuer: process.env.JWT_ISSUER,
                audience: process.env.JWT_AUDIENCE,
                algorithm: 'HS256',
            }
        }),
        TypeOrmModule.forFeature([Staffs,Roles,Permissions])
    ],
    providers: [JwtAuthService, JwtStrategy, AuthService,PermissionsGuard],
    exports: [
                JwtAuthService,
                JwtStrategy,
                AuthService,
                PermissionsGuard
            ],
    controllers: [AuthController]
})
export class AuthModule { }
