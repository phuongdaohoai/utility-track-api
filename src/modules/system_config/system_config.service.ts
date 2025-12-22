import { Injectable, BadRequestException, ServiceUnavailableException, NotFoundException } from "@nestjs/common";
import { SystemConfigs } from "src/entities/system-configs.entity";
import { Repository } from "typeorm"
import { ERROR_CODE } from "src/common/constants/error-code.constant";
import { UpdateGeneralConfigDto } from "./dto/update-general-config.dto.ts";
import { UpdateMethodConfigDto } from "./dto/update-method-config.dto";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class SystemService {
    constructor(
        @InjectRepository(SystemConfigs)
        private repo: Repository<SystemConfigs>
    ) { }

    //Lay tat ca
    async getAll() {
        return await this.repo.find();
    }

    //Update cau hinh chung
    async updateGeneral(dto: UpdateGeneralConfigDto) {
        const config = await this.repo.findOne({ where: { configKey: dto.key } })
        if (!config) throw new NotFoundException(ERROR_CODE.SYSTEM_CONFIG_NOT_FOUND)

        config.configValue = dto.values
        return await this.repo.save(config)
    }

    //Update phuong thuc

    async updateMethod(id: number, dto: UpdateMethodConfigDto) {
        const config = await this.repo.findOne({ where: { id } })
        if (!config) throw new NotFoundException(ERROR_CODE.SYSTEM_CONFIG_NOT_FOUND)

        config.configValue = dto.value;
        if (dto.description) config.description = dto.description;

        return await this.repo.save(config);

    }

    async validateAccess(rawMethod: string, isGuest: boolean = false) {

        // 1. Check trạng thái toàn hệ thống
        const systemStatus = await this.repo.findOne({
            where: { configKey: ERROR_CODE.SYSTEM_CONFIG_SYSTEM_STATUS }
        });

        // Check active/inactive
        if (systemStatus && Number(systemStatus.configValue) === ERROR_CODE.SYSTEM_CONFIG_INACTIVE) {
            throw new ServiceUnavailableException(ERROR_CODE.SYSTEM_CONFIG_MAINTENANCE);
        }

        // 2. Check riêng phương thức 
        if (rawMethod) {
            // Logic: Biến 'faceid' thành 'METHOD_FACEID'
            const dbKey = `METHOD_${rawMethod.toUpperCase()}`;

            const methodConfig = await this.repo.findOne({ where: { configKey: dbKey } });

            // Nếu tìm thấy config VÀ giá trị là 0 (Inactive)
            if (methodConfig && Number(methodConfig.configValue) === ERROR_CODE.SYSTEM_CONFIG_INACTIVE) {
                const reason = methodConfig.description ? ` (${methodConfig.description})` : '';
                throw new BadRequestException(ERROR_CODE.SYSTEM_CONFIG_MAINTENANCE);
            }
        }
    }
}