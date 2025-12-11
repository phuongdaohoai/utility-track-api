import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Nếu endpoint không yêu cầu permission → cho phép
        if (!requiredPermissions) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user; // payload JWT

        if (!user || !user.permissions) {
            throw new ForbiddenException('Bạn không có quyền truy cập');
        }

        const userPermissions = user.permissions;

        const hasPermission = requiredPermissions.every((p) =>
            userPermissions.includes(p)
        );

        if (!hasPermission) {
            throw new ForbiddenException('Không đủ quyền');
        }

        return true;
    }
}
