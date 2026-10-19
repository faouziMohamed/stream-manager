import { paginationValidators } from '@/server/features/common/schemas/validators/pagination.validators';

describe('paginationValidators', () => {
  it('applies defaults when fields are omitted', () => {
    expect(paginationValidators.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('accepts valid explicit values', () => {
    expect(paginationValidators.parse({ page: 3, pageSize: 50 })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it('accepts the maximum page size of 100', () => {
    expect(paginationValidators.parse({ pageSize: 100 }).pageSize).toBe(100);
  });

  it('rejects a page below 1', () => {
    expect(paginationValidators.safeParse({ page: 0 }).success).toBe(false);
  });

  it('rejects a negative page', () => {
    expect(paginationValidators.safeParse({ page: -1 }).success).toBe(false);
  });

  it('rejects a page size above the max', () => {
    expect(paginationValidators.safeParse({ pageSize: 101 }).success).toBe(false);
  });

  it('rejects a page size below 1', () => {
    expect(paginationValidators.safeParse({ pageSize: 0 }).success).toBe(false);
  });

  it('rejects non-integer values', () => {
    expect(paginationValidators.safeParse({ page: 1.5 }).success).toBe(false);
  });
});
