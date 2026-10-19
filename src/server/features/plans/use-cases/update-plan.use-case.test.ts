import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';
import { updatePlanUseCase } from '@/server/features/plans/use-cases/update-plan.use-case';

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

describe('updatePlanUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findPlanByIdCalls = 0;
    let findServiceByIdCalls = 0;
    let updatePlanCalls = 0;

    await expect(
      updatePlanUseCase(
        {
          id: 'pln_test',
          name: 'Netflix Premium',
        },
        userContext,
        {
          findPlanById: async () => {
            findPlanByIdCalls += 1;
            return planRecord;
          },
          findServiceById: async () => {
            findServiceByIdCalls += 1;
            return activeServiceModel;
          },
          updatePlan: async () => {
            updatePlanCalls += 1;
            return planRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });

    expect(findPlanByIdCalls).toBe(0);
    expect(findServiceByIdCalls).toBe(0);
    expect(updatePlanCalls).toBe(0);
  });

  it('rejects updates for a missing plan', async () => {
    let findServiceByIdCalls = 0;
    let updatePlanCalls = 0;

    await expect(
      updatePlanUseCase(
        {
          id: 'pln_missing',
          name: 'Netflix Premium',
        },
        adminContext,
        {
          findPlanById: async () => null,
          findServiceById: async () => {
            findServiceByIdCalls += 1;
            return activeServiceModel;
          },
          updatePlan: async () => {
            updatePlanCalls += 1;
            return planRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      code: 'PLAN_NOT_FOUND',
      statusCode: 404,
    });

    expect(findServiceByIdCalls).toBe(0);
    expect(updatePlanCalls).toBe(0);
  });

  it('rejects when the referenced service does not exist', async () => {
    let updatePlanCalls = 0;

    await expect(
      updatePlanUseCase(
        {
          id: 'pln_test',
          serviceId: 'svc_missing',
        },
        adminContext,
        {
          findPlanById: async () => planRecord,
          findServiceById: async () => null,
          updatePlan: async () => {
            updatePlanCalls += 1;
            return planRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      code: 'PLAN_SERVICE_NOT_FOUND',
      statusCode: 404,
    });

    expect(updatePlanCalls).toBe(0);
  });

  it('rejects when the referenced service is inactive', async () => {
    let updatePlanCalls = 0;

    await expect(
      updatePlanUseCase(
        {
          id: 'pln_test',
          serviceId: 'svc_inactive',
        },
        adminContext,
        {
          findPlanById: async () => planRecord,
          findServiceById: async () => inactiveServiceModel,
          updatePlan: async () => {
            updatePlanCalls += 1;
            return planRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      code: 'PLAN_SERVICE_INACTIVE',
      statusCode: 409,
    });

    expect(updatePlanCalls).toBe(0);
  });

  it('rejects when the repository cannot update the plan', async () => {
    await expect(
      updatePlanUseCase(
        {
          id: 'pln_test',
          name: 'Netflix Premium',
        },
        adminContext,
        {
          findPlanById: async () => planRecord,
          findServiceById: async () => activeServiceModel,
          updatePlan: async () => null,
        }
      )
    ).rejects.toMatchObject({
      code: 'PLAN_UPDATE_FAILED',
      statusCode: 500,
    });
  });

  it('updates a plan for an admin user', async () => {
    const plan = await updatePlanUseCase(
      {
        currencyCode: 'USD',
        id: 'pln_test',
        isActive: false,
        name: 'Netflix Premium',
        planType: 'family',
        price: '129.99',
        serviceId: 'svc_test',
      },
      adminContext,
      {
        findPlanById: async () => planRecord,
        findServiceById: async () => activeServiceModel,
        updatePlan: async (id, input) => ({
          ...planRecord,
          ...input,
          id,
          currencyCode: input.currencyCode ?? planRecord.currencyCode,
          isActive: input.isActive ?? planRecord.isActive,
          name: input.name ?? planRecord.name,
          planType: input.planType ?? planRecord.planType,
          price: input.price ?? planRecord.price,
          serviceId: input.serviceId ?? planRecord.serviceId,
          updatedAt: new Date('2026-02-01T00:00:00.000Z'),
        }),
      }
    );

    expect(plan.id).toBe('pln_test');
    expect(plan.name).toBe('Netflix Premium');
    expect(plan.currencyCode).toBe('USD');
    expect(plan.isActive).toBe(false);
    expect(plan.updatedAt.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });
});

const activeServiceModel: ServiceModel = {
  category: 'video',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  descriptionContent: null,
  id: 'svc_test',
  imageKey: null,
  isActive: true,
  name: 'Netflix',
  supportsProfiles: true,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const inactiveServiceModel: ServiceModel = {
  ...activeServiceModel,
  id: 'svc_inactive',
  isActive: false,
};

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
  serviceId: 'svc_test',
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
