// src/common/helpers/query-builder.helper.ts

import { ObjectLiteral } from 'typeorm';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ERROR_CODE } from '../constants/error-code.constant';

export interface FilterPayload {
    field: string;
    operator:
    | 'is'
    | 'is_not'
    | 'contains'
    | 'in'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'range';
    value?: any;
    from?: any;
    to?: any;
}

export interface SearchField {
    entityAlias: string;
    field: string;
    collate?: boolean; // true để dùng COLLATE cho tìm kiếm không phân biệt dấu (SQL Server)
}

export class QueryBuilderHelper {
    /**
     * Áp dụng tìm kiếm chung (LIKE) lên nhiều trường
     */
    static applySearch<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        search: string | undefined,
        fields: SearchField[],
    ): void {
        if (!search?.trim()) return;

        const term = search.trim();
        qb.andWhere(
            new Brackets((subQb) => {
                fields.forEach(({ entityAlias, field, collate }) => {
                    const paramName = `search_${field}`;
                    const likeExpr = collate
                        ? `${entityAlias}.${field} LIKE :${paramName} COLLATE SQL_Latin1_General_CP1253_CI_AI`
                        : `${entityAlias}.${field} LIKE :${paramName}`;
                    subQb.orWhere(likeExpr, { [paramName]: `%${term}%` });
                });
            }),
        );
    }

    /**
     * Áp dụng filter động với đầy đủ operator: is, is_not, contains, in, gt, gte, lt, lte, range
     */
    static applyFilters<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        rawFilters: any,
        fieldMapping?: Record<string, string>,
    ): void {
        if (!rawFilters) return;

        let filters: FilterPayload[];
        try {
            filters =
                typeof rawFilters === 'string' ? JSON.parse(rawFilters) : rawFilters;
        } catch (error) {
            throw new BadRequestException({
                errorCode: ERROR_CODE.FILTER_PARSE_ERROR,
                details: { message: error instanceof Error ? error.message : 'Invalid JSON' },
            });
        }

        if (!Array.isArray(filters) || filters.length === 0) return;

        filters.forEach((f, index) => {
            let dbField = f.field;
            if (fieldMapping && fieldMapping[f.field]) {
                dbField = fieldMapping[f.field];
            }

            const baseParam = `filter_${index}_${Math.random().toString(36).substr(2, 9)}`;

            switch (f.operator) {
                case 'is':
                    if (f.value === null || f.value === 'null' || f.value === '') {
                        qb.andWhere(`${dbField} IS NULL`);
                    } else if (f.field.toLowerCase().includes('date')) {
                        // Xử lý ngày chính xác từ 00:00:00 đến 23:59:59
                        qb.andWhere(`${dbField} >= :${baseParam}_start AND ${dbField} <= :${baseParam}_end`, {
                            [`${baseParam}_start`]: `${f.value} 00:00:00`,
                            [`${baseParam}_end`]: `${f.value} 23:59:59`,
                        });
                    } else {
                        qb.andWhere(`${dbField} = :${baseParam}`, { [baseParam]: f.value });
                    }
                    break;

                case 'is_not':
                    qb.andWhere(`${dbField} != :${baseParam}`, { [baseParam]: f.value });
                    break;

                case 'contains':
                    if (Array.isArray(f.value)) {
                        qb.andWhere(
                            new Brackets((subQb) => {
                                f.value.forEach((val: any, i: number) => {
                                    const subParam = `${baseParam}_${i}`;
                                    subQb.orWhere(`${dbField} LIKE :${subParam} COLLATE SQL_Latin1_General_CP1253_CI_AI`, {
                                        [subParam]: `%${val}%`,
                                    });
                                });
                            }),
                        );
                    } else {
                        qb.andWhere(`${dbField} LIKE :${baseParam} COLLATE SQL_Latin1_General_CP1253_CI_AI`, {
                            [baseParam]: `%${f.value}%`,
                        });
                    }
                    break;

                case 'in':
                    if (Array.isArray(f.value) && f.value.length > 0) {
                        qb.andWhere(`${dbField} IN (:...${baseParam})`, { [baseParam]: f.value });
                    }
                    break;

                case 'gt':
                    qb.andWhere(`${dbField} > :${baseParam}`, { [baseParam]: f.value });
                    break;

                case 'gte':
                    qb.andWhere(`${dbField} >= :${baseParam}`, { [baseParam]: f.value });
                    break;

                case 'lt':
                    qb.andWhere(`${dbField} < :${baseParam}`, { [baseParam]: f.value });
                    break;

                case 'lte':
                    qb.andWhere(`${dbField} <= :${baseParam}`, { [baseParam]: f.value });
                    break;

                case 'range':
                    if (f.from !== undefined && f.to !== undefined) {
                        const toValue = f.field.toLowerCase().includes('date') ? `${f.to} 23:59:59` : f.to;
                        qb.andWhere(`${dbField} BETWEEN :${baseParam}_from AND :${baseParam}_to`, {
                            [`${baseParam}_from`]: f.from,
                            [`${baseParam}_to`]: toValue,
                        });
                    }
                    break;

                default:
                    // Bỏ qua operator không hỗ trợ (có thể log nếu cần)
                    break;
            }
        });
    }

    /**
     * Áp dụng phân trang và trả về kết quả chuẩn
     */
    static async applyPagination<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        page: number = 1,
        pageSize: number = 10,
    ): Promise<{
        items: T[];
        totalItem: number;
        page: number;
        pageSize: number;
    }> {
        const safePage = page < 1 ? 1 : page;
        const safePageSize = pageSize < 1 ? 10 : pageSize;

        const totalItem = await qb.getCount();

        const items = await qb
            .skip((safePage - 1) * safePageSize)
            .take(safePageSize)
            .getMany();

        return {
            items,
            totalItem,
            page: safePage,
            pageSize: safePageSize,
        };
    }
}