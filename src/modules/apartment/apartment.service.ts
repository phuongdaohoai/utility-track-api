import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ERROR_CODE } from 'src/common/constants/error-code.constant';
import { Apartments } from 'src/entities/apartments.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class ApartmentService {
    constructor(
        @InjectRepository(Apartments)
        private repo: Repository<Apartments>
    ) { }

    async findAll() {
        return this.repo.find({
            select: ['id', 'building', 'roomNumber', 'floorNumber'],
            order: { building: 'ASC', roomNumber: 'ASC' }
        });
    }

    async findByIds(ids: number[]) {
        if (ids.length === 0) return [];
        return this.repo.find({
            where: { id: In(ids) },
            select: ['id', 'building', 'roomNumber', 'floorNumber'],
        });
    }
}
