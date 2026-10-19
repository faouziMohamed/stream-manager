export const defaultPage = 1;
export const defaultPageSize = 20;
export const maxPageSize = 100;

export interface PaginationArgs {
  page: number;
  pageSize: number;
}

export function paginationOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function paginationMeta(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}
