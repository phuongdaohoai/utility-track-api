export const ERROR_CODE = {
    //auth module
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',         // Sai email hoặc mật khẩu
    AUTH_ACCOUNT_NOT_FOUND: 'AUTH_ACCOUNT_NOT_FOUND',             // Không tìm thấy tài khoản
    AUTH_INVALID_PASSWORD: 'AUTH_INVALID_PASSWORD',               // Mật khẩu sai (riêng biệt nếu muốn tách)
    AUTH_NO_ROLE_ASSIGNED: 'AUTH_NO_ROLE_ASSIGNED',               // User không có role (role.id = 0)
    AUTH_ROLE_NOT_FOUND: 'AUTH_ROLE_NOT_FOUND',                   // Role không tồn tại trong DB
    AUTH_NO_PERMISSIONS: 'AUTH_NO_PERMISSIONS',

    // Permission / Authorization
    AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',                     // Không có quyền truy cập (403 chung)
    AUTH_MISSING_PERMISSION: 'AUTH_MISSING_PERMISSION',   // Thiếu quyền cụ thể
    AUTH_NO_PERMISSIONS_PROVIDED: 'AUTH_NO_PERMISSIONS_PROVIDED', // User không có permissions nào
    //dashboard moudle
    //history modole
    HISTORY_SUCCESS: 'success',
    HISTORY_INVALID_PAGE: 'HISTORY_INVALID_PAGE',//Số trang không hợp lệ
    HISTORY_SYSTEM_ERROR: 'HISTORY_SYSTEM_ERROR',//Lỗi hệ thống,xin thử lại
    HISTORY_NOT_FOUND: 'HISTORY_NOT_FOUND',//Không tìm thấy lịch sử dịch vụ
    HISTORY_INVALID_DATE: 'HISTORY_INVALID_DATE',//Ngày sử dụng không hợp lệ
    HISTORY_DUPLICATE_ENTRY: 'HISTORY_DUPLICATE_ENTRY',//Lịch sử đã tồn tại
    SERVICE_USAGE_HISTORY_NOT_FOUND: 'SERVICE_USAGE_HISTORY_NOT_FOUND', // Không tìm thấy lịch sử sử dụng dịch vụ


    // ==================== RESIDENT MODULE ====================
    RESIDENT_NOT_FOUND: 'RESIDENT_NOT_FOUND',    // Không tìm thấy cư dân theo ID  
    RESIDENT_IMPORT_DUPLICATE_PHONE: 'RESIDENT_IMPORT_DUPLICATE_PHONE', // Import cư dân bị trùng số điện thoại trong file import
    RESIDENT_IMPORT_DUPLICATE_CCCD: 'RESIDENT_IMPORT_DUPLICATE_CCCD',    // Import cư dân bị trùng CCCD trong file import
    RESIDENT_IMPORT_DUPLICATE_EMAIL: 'RESIDENT_IMPORT_DUPLICATE_EMAIL',    // Import cư dân bị trùng email trong file import
    RESIDENT_IMPORT_SAVE_ERROR: 'RESIDENT_IMPORT_SAVE_ERROR',// Lỗi khi lưu dữ liệu cư dân trong quá trình import
    RESIDENT_FILTER_PARSE_ERROR: 'RESIDENT_FILTER_PARSE_ERROR',    // Lỗi parse filter (query filter không hợp lệ / sai format)
    RESIDENT_APARTMENT_NOT_FOUND: 'RESIDENT_APARTMENT_NOT_FOUND', // Lỗi không tìm thấy phòng
    // ==================== SERVICE MODULE ====================
    SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND', // Không tìm thấy dịch vụ theo ID
    SERVICE_NAME_EXISTS: 'SERVICE_NAME_EXISTS', // Tên dịch vụ đã tồn tại khi tạo mới
    SERVICE_NAME_IN_USE_BY_OTHER: 'SERVICE_NAME_IN_USE_BY_OTHER', // Tên dịch vụ đã dùng bởi dịch vụ khác khi cập nhật
    // ==================== STAFF MODULE ====================
    STAFF_NOT_FOUND: 'STAFF_NOT_FOUND', // Không tìm thấy nhân viên theo ID
    STAFF_EMAIL_IN_USE_BY_OTHER: 'STAFF_EMAIL_IN_USE_BY_OTHER', // Email đã dùng bởi nhân viên khác khi update
    STAFF_PHONE_IN_USE_BY_OTHER: 'STAFF_PHONE_IN_USE_BY_OTHER', // Số điện thoại đã dùng bởi nhân viên khác khi update
    STAFF_CANNOT_DELETE_SELF: 'STAFF_CANNOT_DELETE_SELF', // Không thể tự xóa tài khoản của mình
    STAFF_CANNOT_DELETE_SUPER_ADMIN: 'STAFF_CANNOT_DELETE_SUPER_ADMIN', // Không thể xóa tài khoản Super Admin
    STAFF_FILTER_PARSE_ERROR: 'STAFF_FILTER_PARSE_ERROR', // Lỗi parse filters từ frontend
    // ==================== UPLOAD MODULE ====================
    UPLOAD_INVALID_FILES: 'UPLOAD_INVALID_FILES', //file kh hợp lệ,
    // ==================== VALIDATE CHUNG ====================
    FILTER_PARSE_ERROR: 'FILTER_PARSE_ERROR', // Lỗi parse filter JSON (dùng chung mọi module)
    ALREADY_DELETED: 'ALREADY_DELETED',   // dữ liệu đã bị xoá (soft delete) trước đó   
    VERSION_CONFLICT: 'VERSION_CONFLICT',// Xung đột version (optimistic locking) – dữ liệu đã bị cập nhật bởi request khác
    PHONE_EXISTS: 'PHONE_EXISTS',  // Số điện thoại đã tồn tại trong hệ thống
    EMAIL_EXISTS: 'EMAIL_EXISTS',    // Email đã tồn tại trong hệ thống
    CCCD_EXISTS: 'CCCD_EXISTS',    // CCCD đã tồn tại trong hệ thống
    PHONE_IN_USE_BY_OTHER: 'PHONE_IN_USE_BY_OTHER',    // Số điện thoại đang được sử dụng bởi người khác
    EMAIL_IN_USE_BY_OTHER: 'EMAIL_IN_USE_BY_OTHER',    // Email đang được sử dụng bởi người khác
  
    // ==================== SYSTEM CONFIG ====================
    SYSTEM_CONFIG_NOT_FOUND: 'This configuration was not found.',
    SYSTEM_CONFIG_MAINTENANCE: 'The system is currently undergoing maintenance.',
    SYSTEM_CONFIG_INVALID_KEY: 'INVALID_CONFIG_KEY',
  
    // ==================== APARTMENT MODULE ====================
    APARTMENT_NOT_FOUND: 'APARTMENT_NOT_FOUND', // Không tìm thấy phòng theo ID

    // ==================== CHECKIN-OUT MODULE ====================
    CHECKIN_INVALID_RESIDENT: 'CHECKIN_INVALID_RESIDENT', // Cư dân không hợp lệ
    CHECKIN_NO_ACTIVE_CHECKIN: 'CHECKIN_NO_ACTIVE_CHECKIN', // Không có check-in đang hoạt động
} as const;


