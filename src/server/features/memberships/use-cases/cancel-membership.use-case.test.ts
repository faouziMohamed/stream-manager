import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { cancelMembershipUseCase } from '@/server/features/memberships/use-cases/cancel-membership.use-case';

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

describe('cancelMembershipUseCase', () => {
  it('requires explicit confirmation', async () => {
    await expect(
      cancelMembershipUseCase(
        {
          confirmed: false,
          id: 'mbr_test',
        },
        adminContext,
        {
          cancelMembershipWithPendingPayments: async () => membershipRecord,
          findMembershipById: async () => membershipRecord,
          today: () => '2026-06-01',
        }
      )
    ).rejects.toMatchObject({
      code: 'MEMBERSHIP_CANCEL_CONFIRMATION_REQUIRED',
      statusCode: 400,
    });
  });

  it('rejects missing memberships before cancellation', async () => {
    let cancelCalls = 0;

    await expect(
      cancelMembershipUseCase(
        {
          confirmed: true,
          id: 'mbr_missing',
        },
        adminContext,
        {
          cancelMembershipWithPendingPayments: async () => {
            cancelCalls += 1;
            return membershipRecord;
          },
          findMembershipById: async () => null,
          today: () => '2026-06-01',
        }
      )
    ).rejects.toMatchObject({
      code: 'MEMBERSHIP_NOT_FOUND',
      statusCode: 404,
    });

    expect(cancelCalls).toBe(0);
  });

  it('cancels membership and pending payments', async () => {
    const membership = await cancelMembershipUseCase(
      {
        confirmed: true,
        id: 'mbr_test',
      },
      adminContext,
      {
        cancelMembershipWithPendingPayments: async (id) => ({
          ...membershipRecord,
          id,
          status: 'cancelled',
        }),
        findMembershipById: async () => membershipRecord,
        today: () => '2026-06-01',
      }
    );

    expect(membership.status).toBe('cancelled');
  });

  it('gives the repository the day that separates future charges from debt already due', async () => {
    let receivedToday: string | undefined;

    await cancelMembershipUseCase({ confirmed: true, id: 'mbr_test' }, adminContext, {
      cancelMembershipWithPendingPayments: async (_id, today) => {
        receivedToday = today;
        return { ...membershipRecord, status: 'cancelled' };
      },
      findMembershipById: async () => membershipRecord,
      today: () => '2026-06-01',
    });

    expect(receivedToday).toBe('2026-06-01');
  });
});

const membershipRecord = {
  businessId: 'MBR-2026-0001',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  customerId: 'cst_test',
  endDate: '2026-06-10',
  id: 'mbr_test',
  isRecurring: false,
  planId: 'pln_test',
  renewedFromId: null,
  startDate: '2026-05-10',
  status: 'active' as const,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
