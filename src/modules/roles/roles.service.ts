import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from 'src/entities/roles.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Roles)
        private repo: Repository<Roles>
    ){}

    async findAll(){
        return await this.repo.find();
    }
}
