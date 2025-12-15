import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ServiceUsageHistory } from 'src/entities/entities/service-usage-history.entity';
import { Residents } from 'src/entities/entities/residents.entity';
import { Services } from 'src/entities/entities/services.entity';
import { CreateCheckInDto } from "./dto/create-checkin.dto";
import { CheckInOut } from "src/entities/entities/check-in-out.entity";
import { CreateCheckInAuTo } from "./dto/check-in-auto.dto";
import { In, Repository } from "typeorm";
import { privateEncrypt } from "crypto";

@Injectable()
export class CheckIn {
    constructor(
        @InjectRepository(ServiceUsageHistory)
        private readonly serviceUsageRepo: Repository<ServiceUsageHistory>,
        @InjectRepository(Residents)
        private readonly residentRepo: Repository<Residents>,
        @InjectRepository(Services)
        private readonly serviceRepo: Repository<Services>,
        @InjectRepository(CheckInOut)
        private readonly checkInOutRepo: Repository<CheckInOut>,
    ) { }


}