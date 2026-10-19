import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { generateSummaryLinkUseCase } from '@/server/features/settings/use-cases/generate-summary-link.use-case';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: { avatar: null, email: 'admin@example.com', id: 'usr_admin', name: 'Admin', role: 'admin' },
};

const anonContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

const userContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: 'ses_user',
  user: { avatar: null, email: 'user@example.com', id: 'usr_user', name: 'User', role: 'user' },
};

const summaryLink = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  expiresAt: null as Date | null,
  id: 'lnk_1',
  label: null as string | null,
  token: 'abc123',
};

describe('generateSummaryLinkUseCase', () => {
  it('creates a summary link with no expiry when expiresInDays is null', async () => {
    let savedExpiresAt: Date | null | undefined;

    const result = await generateSummaryLinkUseCase(
      { expiresInDays: null, label: null },
      adminContext,
      {
        createId: () => 'lnk_1',
        createSummaryLink: async (input) => {
          savedExpiresAt = input.expiresAt;
          return {
            ...summaryLink,
            ...input,
            expiresAt: input.expiresAt ?? null,
            label: input.label ?? null,
          };
        },
        createToken: () => 'abc123',
      }
    );

    expect(result.id).toBe('lnk_1');
    expect(savedExpiresAt).toBeNull();
  });

  it('calculates expiresAt correctly from expiresInDays', async () => {
    const before = Date.now();
    let savedExpiresAt: Date | null | undefined = null;

    await generateSummaryLinkUseCase({ expiresInDays: 7, label: 'Week link' }, adminContext, {
      createId: () => 'lnk_2',
      createSummaryLink: async (input) => {
        savedExpiresAt = input.expiresAt;
        return {
          ...summaryLink,
          ...input,
          expiresAt: input.expiresAt ?? null,
          label: input.label ?? null,
        };
      },
      createToken: () => 'def456',
    });

    const after = Date.now();
    expect(savedExpiresAt).not.toBeNull();
    const ms = (savedExpiresAt as unknown as Date).getTime();
    expect(ms).toBeGreaterThanOrEqual(before + 7 * 24 * 60 * 60 * 1000);
    expect(ms).toBeLessThanOrEqual(after + 7 * 24 * 60 * 60 * 1000);
  });

  it('stores the provided label', async () => {
    let savedLabel: string | null = null;

    await generateSummaryLinkUseCase({ expiresInDays: null, label: 'My Link' }, adminContext, {
      createId: () => 'lnk_3',
      createSummaryLink: async (input) => {
        savedLabel = input.label ?? null;
        return {
          ...summaryLink,
          ...input,
          expiresAt: input.expiresAt ?? null,
          label: input.label ?? null,
        };
      },
      createToken: () => 'ghi789',
    });

    expect(savedLabel).toBe('My Link');
  });

  it('throws SUMMARY_LINK_CREATE_FAILED when repository returns null', async () => {
    await expect(
      generateSummaryLinkUseCase({ expiresInDays: null, label: null }, adminContext, {
        createId: () => 'lnk_fail',
        createSummaryLink: async () => null,
        createToken: () => 'tok_fail',
      })
    ).rejects.toMatchObject({ code: 'SUMMARY_LINK_CREATE_FAILED' });
  });

  it('rejects non-admin users with FORBIDDEN', async () => {
    await expect(
      generateSummaryLinkUseCase({ expiresInDays: null, label: null }, userContext, {
        createId: () => 'lnk_1',
        createSummaryLink: async () => summaryLink,
        createToken: () => 'abc123',
      })
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('rejects unauthenticated users with UNAUTHENTICATED', async () => {
    await expect(
      generateSummaryLinkUseCase({ expiresInDays: null, label: null }, anonContext, {
        createId: () => 'lnk_1',
        createSummaryLink: async () => summaryLink,
        createToken: () => 'abc123',
      })
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});
