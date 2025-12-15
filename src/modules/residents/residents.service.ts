import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Residents } from 'src/entities/entities/residents.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ResidentsService {
    constructor
        (
            @InjectRepository(Residents)
            private repo: Repository<Residents>
        ) { }
    findAll() {
        return this.repo.find();
    }
    async create(data: Partial<Residents>) {
        const resident = this.repo.create(data);
        return this.repo.save(resident);
    }
}
