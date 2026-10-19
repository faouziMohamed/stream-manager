import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { getMembershipTimelineUseCase } from '@/server/features/analytics/use-cases/get-membership-timeline.use-case';

const authContext: GqlContext = {
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

const timelineRows = [
  {
    customerName: 'Acme',
    endDate: '2026-12-31',
    id: 'mbr_1',
    planName: 'Pro',
    startDate: '2026-01-01',
  },
  {
    customerName: 'Globex',
    endDate: '2027-01-31',
    id: 'mbr_2',
    planName: 'Basic',
    startDate: '2026-02-01',
  },
];

describe('getMembershipTimelineUseCase', () => {
  it('returns timeline rows for authenticated users', async () => {
    const result = await getMembershipTimelineUseCase(authContext, {
      getMembershipTimelineRows: async () => timelineRows,
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('mbr_1');
  });

  it('returns an empty array when no data exists', async () => {
    const result = await getMembershipTimelineUseCase(authContext, {
      getMembershipTimelineRows: async () => [],
    });

    expect(result).toHaveLength(0);
  });

  it('rejects unauthenticated users with UNAUTHENTICATED', async () => {
    await expect(
      getMembershipTimelineUseCase(anonContext, {
        getMembershipTimelineRows: async () => [],
      })
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});
