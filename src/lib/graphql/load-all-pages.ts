export type PaginatedConnection<TItem> = {
  items: TItem[];
  pageInfo: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export async function loadAllPages<TConnection extends PaginatedConnection<TItem>, TItem>(
  loadPage: (page: number, pageSize: number) => Promise<TConnection>,
  pageSize = 50
): Promise<TConnection> {
  const firstPage = await loadPage(1, pageSize);

  if (firstPage.pageInfo.totalPages <= 1) {
    return firstPage;
  }

  const items = [...firstPage.items];

  for (let page = 2; page <= firstPage.pageInfo.totalPages; page += 1) {
    const currentPage = await loadPage(page, pageSize);
    items.push(...currentPage.items);
  }

  return {
    ...firstPage,
    items,
    pageInfo: {
      ...firstPage.pageInfo,
      page: 1,
      pageSize,
    },
  };
}
