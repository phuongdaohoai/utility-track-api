import { SelectQueryBuilder, Brackets, ObjectLiteral } from 'typeorm';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PaginationResult } from '../pagination.dto';

// Interface cho dữ liệu Filter từ Frontend gửi lên
export interface BaseFilterDto {
    page?: number;
    pageSize?: number;
    search?: string;
    filters?: string; // JSON string
}

// Interface cấu hình cho Helper
interface FilterConfig {
    alias: string; // Alias của bảng chính (ví dụ: 'resident')
    searchFields?: string[]; // Các trường dùng cho ô Search chung
    fieldMap?: Record<string, string>; // Map tên field FE -> DB (vd: 'room' -> 'apartment.roomNumber')
    dateFields?: string[]; // Danh sách các trường là Ngày tháng (để xử lý logic range trong ngày)
    collation?: string; // Cấu hình Collation cho SQL Server (để tìm tiếng Việt)
}

export class QueryHelper {
    static async apply<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        filter: BaseFilterDto,
        config: FilterConfig
    ): Promise<PaginationResult<T>> {
        const page = Number(filter.page) || 1;
        const pageSize = Number(filter.pageSize) || 10;
        
        // Giá trị mặc định
        const { 
            alias, 
            searchFields = [], 
            fieldMap = {}, 
            dateFields = [],
            // Mặc định dùng Collation của SQL Server như code cũ của bạn
            collation = 'SQL_Latin1_General_CP1253_CI_AI' 
        } = config;

        // --- 1. XỬ LÝ SEARCH CHUNG (Ô tìm kiếm) ---
        if (filter.search?.trim() && searchFields.length > 0) {
            const search = filter.search.trim();
            qb.andWhere(new Brackets(wb => {
                searchFields.forEach(field => {
                    // Áp dụng Collation để tìm kiếm tiếng Việt tốt hơn
                    wb.orWhere(`${field} LIKE :search COLLATE ${collation}`, { search: `%${search}%` });
                });
            }));
        }

        // --- 2. XỬ LÝ FILTERS DYNAMIC (Bộ lọc nâng cao) ---
        if (filter.filters) {
            try {
                const filters = typeof filter.filters === 'string'
                    ? JSON.parse(filter.filters)
                    : filter.filters;

                if (Array.isArray(filters)) {
                    filters.forEach((f, index) => {
                        // Map field: Nếu có trong map thì dùng, không thì mặc định alias.field
                        let dbField = fieldMap[f.field] || `${alias}.${f.field}`;
                        
                        // Tạo tên tham số ngẫu nhiên để tránh trùng lặp
                        const pName = `q_val_${index}_${Math.floor(Math.random() * 10000)}`;
                        
                        // Kiểm tra xem field hiện tại có phải là Date không (dựa vào config truyền vào)
                        const isDate = dateFields.includes(f.field);

                        // Bỏ qua nếu giá trị undefined (trừ check null)
                        if (f.value === undefined && f.operator !== 'is' && f.operator !== 'is_not') return;

                        switch (f.operator) {
                            case 'is':
                                if (f.value === 'null' || f.value === '' || f.value === null) {
                                    qb.andWhere(`${dbField} IS NULL`);
                                } else if (isDate) {
                                    // 🔥 LOGIC GIỮ LẠI: Tìm ngày trong khoảng 00:00:00 -> 23:59:59
                                    const dateStr = f.value; 
                                    qb.andWhere(`${dbField} >= :${pName}_start AND ${dbField} <= :${pName}_end`, {
                                        [`${pName}_start`]: `${dateStr} 00:00:00`,
                                        [`${pName}_end`]: `${dateStr} 23:59:59`
                                    });
                                } else {
                                    // Tìm chính xác
                                    qb.andWhere(`${dbField} = :${pName}`, { [pName]: f.value });
                                }
                                break;

                            case 'is_not':
                                qb.andWhere(`${dbField} != :${pName}`, { [pName]: f.value });
                                break;

                            case 'contains':
                                if (Array.isArray(f.value)) {
                                    // Logic OR nếu value là mảng
                                    qb.andWhere(new Brackets(wb => {
                                        f.value.forEach((v, i) => {
                                            const subP = `${pName}_${i}`;
                                            wb.orWhere(`${dbField} LIKE :${subP} COLLATE ${collation}`, { [subP]: `%${v}%` });
                                        });
                                    }));
                                } else {
                                    qb.andWhere(`${dbField} LIKE :${pName} COLLATE ${collation}`, { [pName]: `%${f.value}%` });
                                }
                                break;

                            case 'in':
                                if (Array.isArray(f.value) && f.value.length > 0) {
                                    qb.andWhere(`${dbField} IN (:...${pName})`, { [pName]: f.value });
                                }
                                break;

                            case 'gt':
                                qb.andWhere(`${dbField} > :${pName}`, { [pName]: f.value });
                                break;
                            case 'gte':
                                qb.andWhere(`${dbField} >= :${pName}`, { [pName]: f.value });
                                break;
                            case 'lt':
                                qb.andWhere(`${dbField} < :${pName}`, { [pName]: f.value });
                                break;
                            case 'lte':
                                qb.andWhere(`${dbField} <= :${pName}`, { [pName]: f.value });
                                break;

                            case 'range':
                                if (f.from && f.to) {
                                    let toVal = f.to;
                                    // Tự động thêm giờ cuối ngày nếu là Date
                                    if (isDate && !toVal.includes(':')) {
                                        toVal = `${f.to} 23:59:59`;
                                    }
                                    qb.andWhere(`${dbField} BETWEEN :${pName}_from AND :${pName}_to`, {
                                        [`${pName}_from`]: f.from,
                                        [`${pName}_to`]: toVal
                                    });
                                }
                                break;
                        }
                    });
                }
            } catch (error) {
                console.error("Filter Error:", error);
                throw new BadRequestException("Lỗi định dạng bộ lọc");
            }
        }

        // --- 3. PHÂN TRANG & THỰC THI ---
        try {
            const totalItem = await qb.getCount();
            const items = await qb
                .skip((page - 1) * pageSize)
                .take(pageSize)
                .orderBy(`${alias}.id`, 'DESC') // Mặc định sắp xếp giảm dần theo ID
                .getMany();

            return {
                totalItem,
                page,
                pageSize,
                items
            };
        } catch (error) {
            console.error("Database Query Error:", error);
            throw new InternalServerErrorException("Lỗi truy vấn cơ sở dữ liệu");
        }
    }
}