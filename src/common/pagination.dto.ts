export interface PaginationResult<T> {
    totalItem: number;
    page: number;
    pageSize: number;
    items: T[];
}
