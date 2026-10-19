import { paginationMeta, paginationOffset } from '@/server/common/utils/pagination';

describe('paginationOffset', () => {
  it('returns 0 for the first page', () => {
    expect(paginationOffset(1, 20)).toBe(0);
  });

  it('offsets by a full page on page 2', () => {
    expect(paginationOffset(2, 20)).toBe(20);
  });

  it('scales with page size', () => {
    expect(paginationOffset(3, 50)).toBe(100);
  });
});

describe('paginationMeta', () => {
  it('reports zero pages for an empty result set', () => {
    expect(paginationMeta(0, 1, 20)).toEqual({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  });

  it('reports a single page when total fits exactly', () => {
    expect(paginationMeta(20, 1, 20).totalPages).toBe(1);
  });

  it('rounds up a partially-filled last page', () => {
    expect(paginationMeta(21, 1, 20).totalPages).toBe(2);
  });

  it('computes exact multiples without an extra page', () => {
    expect(paginationMeta(100, 1, 20).totalPages).toBe(5);
  });

  it('handles a single overflow item', () => {
    expect(paginationMeta(101, 1, 20).totalPages).toBe(6);
  });

  it('passes through page and pageSize unchanged', () => {
    expect(paginationMeta(5, 3, 10)).toEqual({ page: 3, pageSize: 10, total: 5, totalPages: 1 });
  });
});
