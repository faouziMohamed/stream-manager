import { getSummaryByTokenUseCase } from '@/server/features/settings/use-cases/get-summary-by-token.use-case';

const validLink = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  expiresAt: null as Date | null,
  id: 'lnk_1',
  label: null,
  token: 'tok_abc',
};

const now = new Date('2026-06-17T00:00:00.000Z');

const baseDeps = {
  findAllMembershipsForSummary: async () => [],
  findAllPaymentsForSummary: async () => [],
  findSummaryLinkByToken: async () => validLink,
  getNow: () => now,
};

describe('getSummaryByTokenUseCase', () => {
  it('returns memberships and payments for a valid token', async () => {
    const memberships = [{ id: 'mbr_1' }] as never[];
    const payments = [{ id: 'pay_1' }] as never[];

    const result = await getSummaryByTokenUseCase('tok_abc', {
      ...baseDeps,
      findAllMembershipsForSummary: async () => memberships,
      findAllPaymentsForSummary: async () => payments,
    });

    expect(result).not.toBeNull();
    expect(result?.memberships).toHaveLength(1);
    expect(result?.payments).toHaveLength(1);
  });

  it('returns null when the token is not found', async () => {
    const result = await getSummaryByTokenUseCase('tok_invalid', {
      ...baseDeps,
      findSummaryLinkByToken: async () => null,
    });

    expect(result).toBeNull();
  });

  it('returns null when the link is expired', async () => {
    const expiredLink = {
      ...validLink,
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const result = await getSummaryByTokenUseCase('tok_expired', {
      ...baseDeps,
      findSummaryLinkByToken: async () => expiredLink,
      getNow: () => new Date('2026-06-17T00:00:00.000Z'),
    });

    expect(result).toBeNull();
  });

  it('returns data when the link is not yet expired', async () => {
    const futureLink = {
      ...validLink,
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    };

    const result = await getSummaryByTokenUseCase('tok_future', {
      ...baseDeps,
      findSummaryLinkByToken: async () => futureLink,
      getNow: () => new Date('2026-06-17T00:00:00.000Z'),
    });

    expect(result).not.toBeNull();
  });

  it('returns data when link has no expiry date', async () => {
    const result = await getSummaryByTokenUseCase('tok_no_expiry', {
      ...baseDeps,
      findSummaryLinkByToken: async () => ({ ...validLink, expiresAt: null }),
    });

    expect(result).not.toBeNull();
  });
});
