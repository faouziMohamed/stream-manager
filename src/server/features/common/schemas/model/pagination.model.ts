export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  pageInfo: PageInfo;
}
