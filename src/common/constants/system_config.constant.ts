export enum ConfigType {
    BOOLEAN = 'BOOLEAN',   // 0 hoặc 1
    TIME_RANGE = 'TIME',   // HH:mm-HH:mm
    NUMBER = 'NUMBER',     // Số nguyên
    STRING = 'STRING'      // Chuỗi tự do
}

export const SYSTEM_CONFIG = {
    // ==================== SYSTEM CONFIG ====================
    SYSTEM_CONFIG_OPERATION_HOURS: 'OPERATION_HOURS',
    SYSTEM_CONFIG_SYSTEM_STATUS: 'SYSTEM_STATUS',
    SYSTEM_CONFIG_GUEST_CHECKIN: 'GUEST_CHECKIN',
    SYSTEM_CONFIG_METHOD_CARD: 'METHOD_CARD',
    SYSTEM_CONFIG_METHOD_MANUAL: 'METHOD_MANUAL',
    SYSTEM_CONFIG_METHOD_FACEID: 'METHOD_FACEID',
    SYSTEM_CONFIG_METHOD_QR: 'METHOD_QR',
    SYSTEM_CONFIG_ACTIVE: 1,
    SYSTEM_CONFIG_INACTIVE: 0,
    PREFIX_METHOD: 'METHOD_',
} as const

export const SYSTEM_CONFIG_RULES = {
    // Dùng chính cái Key ở trên để làm định danh -> Đồng bộ 100%
    [SYSTEM_CONFIG.SYSTEM_CONFIG_SYSTEM_STATUS]: {
        type: ConfigType.BOOLEAN,
    },
    [SYSTEM_CONFIG.SYSTEM_CONFIG_GUEST_CHECKIN]: {
        type: ConfigType.BOOLEAN,
    },
    [SYSTEM_CONFIG.SYSTEM_CONFIG_OPERATION_HOURS]: {
        type: ConfigType.TIME_RANGE,
    }
};

export const SYSTEM_CONFIG_VALIDATION_MSG = {
    [ConfigType.BOOLEAN]: "Value must be either '0' (Inactive) or '1' (Active).",
    [ConfigType.TIME_RANGE]: "Invalid time range format (Example: 07:00-22:00).",
    [ConfigType.NUMBER]: "Value must be a valid number.",
    [ConfigType.STRING]: "Invalid value.",
};