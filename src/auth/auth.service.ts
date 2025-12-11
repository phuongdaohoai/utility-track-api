import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from 'src/entities/entities/roles.entity';
import { Staff } from 'src/entities/entities/staff.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Staff) 
        private repoStaff:Repository<Staff>,

        @InjectRepository(Roles)
        private roleRepo:Repository<Roles>

     
    ){}
    async findUserByEmail(email: string) {
        return this.repoStaff.findOne({
            where: {
                email: email,
            },
            select: {
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
