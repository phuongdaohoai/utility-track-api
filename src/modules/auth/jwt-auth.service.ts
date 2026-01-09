import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as crypto from 'crypto';

@Injectable()
export class JwtAuthService {
    private readonly key: string;
    private readonly issuer: string;
    private readonly audience: string;
    private readonly minutes: number;

    constructor(private readonly jwtService: JwtService) {
        this.key = process.env.JWT_SECRET!;
        this.issuer = process.env.JWT_ISSUER!;
        this.audience = process.env.JWT_AUDIENCE!;
        this.minutes = Number(process.env.JWT_EXPIRE_MINUTES || 60);
    }

    generateToken(userLogin: any, role: string, permissions: string[]) {
        const payload: any = {
            staffId: userLogin.id,
            email: userLogin.email,
            role: role,
            fullname: userLogin.fullName,
            permissions: permissions,
            avatar: userLogin.avatar,
            sub: userLogin.staffId,
            jti: crypto.randomUUID(),
            iat: Math.floor(Date.now() / 1000),
        };
        console.log("njkjjlk",this.minutes);
        return this.jwtService.sign(payload, {
            secret: this.key,
            expiresIn: `${this.minutes}m`,
            issuer: this.issuer,
            audience: this.audience,
        });
    }
}