import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { revokeSummaryLinkUseCase } from '@/server/features/settings/use-cases/revoke-summary-link.use-case';

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
  expiresAt: null,
  id: 'lnk_1',
  label: 'Share link',
  token: 'tok_abc123',
};

describe('revokeSummaryLinkUseCase', () => {
  it('deletes an existing summary link for admin', async () => {
    const result = await revokeSummaryLinkUseCase({ id: 'lnk_1' }, adminContext, {
      deleteSummaryLinkById: async () => summaryLink,
    });

    expect(result).toBe(true);
  });

  it('throws NOT_FOUND when summary link does not exist', async () => {
    await expect(
      revokeSummaryLinkUseCase({ id: 'lnk_missing' }, adminContext, {
        deleteSummaryLinkById: async () => null,
      })
    ).rejects.toMatchObject({ code: 'SUMMARY_LINK_NOT_FOUND' });
  });

  it('rejects non-admin users with FORBIDDEN', async () => {
    await expect(
      revokeSummaryLinkUseCase({ id: 'lnk_1' }, userContext, {
        deleteSummaryLinkById: async () => summaryLink,
      })
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('rejects unauthenticated users with UNAUTHENTICATED', async () => {
    await expect(
      revokeSummaryLinkUseCase({ id: 'lnk_1' }, anonContext, {
        deleteSummaryLinkById: async () => summaryLink,
      })
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});
