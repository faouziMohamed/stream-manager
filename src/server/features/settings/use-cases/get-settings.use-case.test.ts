import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { listSummaryLinksUseCase } from '@/server/features/settings/use-cases/get-settings.use-case';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: {
    avatar: null,
    email: 'admin@example.com',
    id: 'usr_admin',
    name: 'Admin',
    role: 'admin',
  },
};

describe('settings read use cases', () => {
  it('returns summary links', async () => {
    const result = await listSummaryLinksUseCase(adminContext, {
      listSummaryLinks: async () => [
        {
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          expiresAt: null,
          id: 'lnk_test',
          label: 'Accountant',
          token: 'token_test',
        },
      ],
    });

    expect(result[0]?.id).toBe('lnk_test');
  });

  it('requires admin role for summary links', async () => {
    await expect(
      listSummaryLinksUseCase(
        {
          ...adminContext,
          isAdmin: false,
          user: { ...adminContext.user!, role: 'accountant' },
        },
        { listSummaryLinks: async () => [] }
      )
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });
});
