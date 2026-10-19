import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import {
  getPlanUseCase,
  getPlansUseCase,
} from '@/server/features/plans/use-cases/get-plans.use-case';

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

const unauthenticatedContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

describe('getPlansUseCase', () => {
  it('returns paginated plans with filters', async () => {
    const result = await getPlansUseCase(
      { isActive: true, page: 1, pageSize: 20, serviceId: 'svc_test' },
      adminContext,
      {
        findPlans: async (input) => {
          expect(input).toStrictEqual({
            isActive: true,
            page: 1,
            pageSize: 20,
            serviceId: 'svc_test',
          });

          return {
            items: [planRecord],
            total: 1,
          };
        },
      }
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('pln_test');
    expect(result.pageInfo.total).toBe(1);
  });

  it('rejects unauthenticated users before listing plans', async () => {
    let findPlansCalls = 0;

    await expect(
      getPlansUseCase({ page: 1, pageSize: 20 }, unauthenticatedContext, {
        findPlans: async () => {
          findPlansCalls += 1;
          return { items: [], total: 0 };
        },
      })
    ).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });

    expect(findPlansCalls).toBe(0);
  });
});

describe('getPlanUseCase', () => {
  it('returns a plan by id', async () => {
    const result = await getPlanUseCase('pln_test', adminContext, {
      findPlanById: async (id) => {
        expect(id).toBe('pln_test');
        return planRecord;
      },
    });

    expect(result).toMatchObject({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'pln_test',
    });
  });

  it('returns null when the plan does not exist', async () => {
    const result = await getPlanUseCase('pln_missing', adminContext, {
      findPlanById: async () => null,
    });

    expect(result).toBeNull();
  });
});

const planRecord = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  currencyCode: 'MAD',
  descriptionContent: null,
  durationMonths: 1,
  id: 'pln_test',
  isActive: true,
  name: 'Netflix Standard',
  planType: 'shared' as const,
  price: '99.99',
  promotionId: null,
  serviceId: 'svc_test',
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
