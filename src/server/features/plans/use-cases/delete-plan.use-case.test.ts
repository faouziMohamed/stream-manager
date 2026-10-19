import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { deletePlanUseCase } from '@/server/features/plans/use-cases/delete-plan.use-case';

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

const userContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: 'ses_user',
  user: {
    avatar: null,
    email: 'user@example.com',
    id: 'usr_user',
    name: 'User',
    role: 'user',
  },
};

describe('deletePlanUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findPlanByIdCalls = 0;
    let countMembershipsForPlanCalls = 0;
    let deletePlanCalls = 0;

    await expect(
      deletePlanUseCase('pln_test', userContext, {
        countMembershipsForPlan: async () => {
          countMembershipsForPlanCalls += 1;
          return 0;
        },
        deletePlan: async () => {
          deletePlanCalls += 1;
          return planRecord;
        },
        findPlanById: async () => {
          findPlanByIdCalls += 1;
          return planRecord;
        },
      })
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });

    expect(findPlanByIdCalls).toBe(0);
    expect(countMembershipsForPlanCalls).toBe(0);
    expect(deletePlanCalls).toBe(0);
  });

  it('rejects deletion for a missing plan', async () => {
    let countMembershipsForPlanCalls = 0;
    let deletePlanCalls = 0;

    await expect(
      deletePlanUseCase('pln_missing', adminContext, {
        countMembershipsForPlan: async () => {
          countMembershipsForPlanCalls += 1;
          return 0;
        },
        deletePlan: async () => {
          deletePlanCalls += 1;
          return planRecord;
        },
        findPlanById: async () => null,
      })
    ).rejects.toMatchObject({
      code: 'PLAN_NOT_FOUND',
      statusCode: 404,
    });

    expect(countMembershipsForPlanCalls).toBe(0);
    expect(deletePlanCalls).toBe(0);
  });

  it('rejects deletion when any membership (even inactive) references the plan', async () => {
    let deletePlanCalls = 0;

    await expect(
      deletePlanUseCase('pln_test', adminContext, {
        // e.g. only expired/cancelled memberships remain — still blocks the FK delete.
        countMembershipsForPlan: async () => 2,
        deletePlan: async () => {
          deletePlanCalls += 1;
          return planRecord;
        },
        findPlanById: async () => planRecord,
      })
    ).rejects.toMatchObject({
      code: 'PLAN_HAS_MEMBERSHIPS',
      statusCode: 409,
    });

    expect(deletePlanCalls).toBe(0);
  });

  it('rejects when the repository cannot delete the plan', async () => {
    await expect(
      deletePlanUseCase('pln_test', adminContext, {
        countMembershipsForPlan: async () => 0,
        deletePlan: async () => null,
        findPlanById: async () => planRecord,
      })
    ).rejects.toMatchObject({
      code: 'PLAN_DELETE_FAILED',
      statusCode: 500,
    });
  });

  it('deletes a plan with no memberships for an admin user', async () => {
    const plan = await deletePlanUseCase('pln_test', adminContext, {
      countMembershipsForPlan: async () => 0,
      deletePlan: async (id) => ({
        ...planRecord,
        id,
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
      findPlanById: async () => planRecord,
    });

    expect(plan.id).toBe('pln_test');
    expect(plan.name).toBe('Netflix Standard');
    expect(plan.updatedAt.toISOString()).toBe('2026-02-01T00:00:00.000Z');
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
