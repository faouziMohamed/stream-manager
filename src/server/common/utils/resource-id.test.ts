import { createResourceId } from '@/server/common/utils/resource-id';

describe('createResourceId', () => {
  it('prefixes the id with the given prefix and an underscore', () => {
    expect(createResourceId('mbr')).toMatch(/^mbr_[\da-f]{32}$/);
  });

  it('strips dashes from the uuid', () => {
    expect(createResourceId('usr')).not.toContain('-');
  });

  it('produces unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createResourceId('pay')));
    expect(ids.size).toBe(1000);
  });

  it('preserves an empty prefix shape', () => {
    expect(createResourceId('')).toMatch(/^_[\da-f]{32}$/);
  });
});
