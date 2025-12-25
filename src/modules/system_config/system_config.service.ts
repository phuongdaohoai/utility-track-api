import { Injectable, BadRequestException, ServiceUnavailableException, NotFoundException } from "@nestjs/common";
import { SystemConfigs } from "src/entities/system-configs.entity";
import { Repository, In } from "typeorm"
import { UpdateGeneralConfigDto } from "./dto/update-general-config.dto.ts";
import { UpdateMethodConfigDto } from "./dto/update-method-config.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { ERROR_CODE } from '../../common/constants/error-code.constant.js';
import {
    SYSTEM_CONFIG,
    SYSTEM_CONFIG_RULES,
    ConfigType,
    SYSTEM_CONFIG_VALIDATION_MSG
} from '../../common/constants/system_config.constant'; 

@Injectable()
export class SystemService {
    constructor(
        @InjectRepository(SystemConfigs)
        private repo: Repository<SystemConfigs>
    ) { }

    //Lây danh sách cấu hình
    async getAll() {
        return await this.repo.find();
    }

    //Update cấu hình chung
    async updateGeneral(dto: UpdateGeneralConfigDto) {
        // 1. Tra cứu luật trong file constant
        const rule = SYSTEM_CONFIG_RULES[dto.key];

        // Nếu khác rule thì trả về lỗi
        if (!rule) {
            throw new BadRequestException(ERROR_CODE.SYSTEM_CONFIG_INVALID_KEY);
        }

        // 2.Gọi hàm validate dữ liệu riêng 
        this.validateConfigValue(dto.value, rule.type);

        const config = await this.repo.findOne({ where: { configKey: dto.key } })
        if (!config) throw new NotFoundException(ERROR_CODE.SYSTEM_CONFIG_NOT_FOUND)

        config.configValue = dto.value
        return await this.repo.save(config)
    }

    //Update phương thức

    async updateMethod(id: number, dto: UpdateMethodConfigDto) {
        const config = await this.repo.findOne({ where: { id } })

        if (!config) throw new NotFoundException(ERROR_CODE.SYSTEM_CONFIG_NOT_FOUND)

        if (!config.configKey.startsWith(SYSTEM_CONFIG.PREFIX_METHOD)) {
            throw new BadRequestException(
                ERROR_CODE.SYSTEM_CONFIG_INVALID_KEY
            );
        }

        config.configValue = dto.value;
        if (dto.description) config.description = dto.description;

        return await this.repo.save(config);

    }

    //3. HÀM CHECK QUYỀN RA VÀO
    async validateAccess(rawMethod: string) {
        // 1. Chuẩn bị danh sách Key cần lấy
        const keysToCheck = [SYSTEM_CONFIG.SYSTEM_CONFIG_SYSTEM_STATUS as string];

        let methodDbKey = '';
        if (rawMethod) {
            methodDbKey = `METHOD_${rawMethod.toUpperCase()}`;
            keysToCheck.push(methodDbKey);
        }

        // 2. Query 1 lần duy nhất
        const configs = await this.repo.find({
            where: { configKey: In(keysToCheck) }
        });

        // 3. Tách dữ liệu ra để check
        const systemConfig = configs.find(c => c.configKey === SYSTEM_CONFIG.SYSTEM_CONFIG_SYSTEM_STATUS);
        const methodConfig = configs.find(c => c.configKey === methodDbKey);

        // 4. Check trạng thái toàn hệ thống
        if (systemConfig && systemConfig.configValue == SYSTEM_CONFIG.SYSTEM_CONFIG_INACTIVE.toString()) {
            throw new ServiceUnavailableException({
                message: 'Hệ thống đang bảo trì.',
                errorCode: ERROR_CODE.SYSTEM_CONFIG_MAINTENANCE
            });
        }

        // 5. Check riêng phương thức
        if (rawMethod && methodConfig) {
            if (methodConfig.configValue == SYSTEM_CONFIG.SYSTEM_CONFIG_INACTIVE.toString()) {
                const reason = methodConfig.description;
                throw new BadRequestException({
                    message: reason,
                    errorCode: ERROR_CODE.SYSTEM_CONFIG_MAINTENANCE
                });
            }
        }
    }

    // 4. PRIVATE: HÀM VALIDATE DỮ LIỆU NHẬP VÀO
    private validateConfigValue(value: string, type: ConfigType) {
        switch (type) {
            case ConfigType.BOOLEAN:
                if (!['0', '1'].includes(value)) {
                    throw new BadRequestException(SYSTEM_CONFIG_VALIDATION_MSG[ConfigType.BOOLEAN]);
                }
                break;

            case ConfigType.TIME_RANGE:
                // Regex: HH:mm-HH:mm (Ví dụ: 07:00-22:00)
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(value)) {
                    throw new BadRequestException(SYSTEM_CONFIG_VALIDATION_MSG[ConfigType.TIME_RANGE]);
                }
                break;

            case ConfigType.NUMBER:
                if (isNaN(Number(value))) {
                    throw new BadRequestException(SYSTEM_CONFIG_VALIDATION_MSG[ConfigType.NUMBER]);
                }
                break;

        }
    }

}

