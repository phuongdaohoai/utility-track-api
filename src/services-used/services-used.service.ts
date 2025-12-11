import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Services } from 'src/entities/entities/services.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ServicesUsedService {
    constructor(
        @InjectRepository(Services)
        private repo: Repository<Services>
    ) { }

    findAll() {
        return this.repo.find();
    }

    async create(data: Partial<Services>) {
        const service = this.repo.create(data);
        return this.repo.save(service);
    }
}
