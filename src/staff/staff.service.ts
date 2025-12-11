import { Injectable } from '@nestjs/common';
import { Injector } from '@nestjs/core/injector/injector';
import { InjectRepository } from '@nestjs/typeorm';
import { Staff } from 'src/entities/entities/staff.entity';
import { StaffModule } from './staff.module';
import { Repository } from 'typeorm';

@Injectable()
export class StaffService {
    constructor(
        @InjectRepository(Staff)
        private repo: Repository<Staff>
    ) { }
    findAll() {
        return this.repo.find();
    }
    async create(data: Partial<Staff>) {
        const staff = this.repo.create(data);
        return this.repo.save(staff);
    }
}
