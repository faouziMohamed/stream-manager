import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';
import { createPlanUseCase } from '@/server/features/plans/use-cases/create-plan.use-case';

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

describe('createPlanUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findServiceByIdCalls = 0;
    let insertPlanCalls = 0;

    await expect(
      createPlanUseCase(
        {
          currencyCode: 'MAD',
          durationMonths: 1,
          name: 'Netflix Standard',
          planType: 'shared',
          price: '99.99',
          serviceId: 'svc_test',
        },
        userContext,
        {
          createId: () => 'pln_test',
          findServiceById: async () => {
            findServiceByIdCalls += 1;
            return activeServiceModel;
          },
          insertPlan: async () => {
            insertPlanCalls += 1;
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

    expect(findServiceByIdCalls).toBe(0);
    expect(insertPlanCalls).toBe(0);
  });

  it('rejects when the referenced service does not exist', async () => {
    let insertPlanCalls = 0;

    await expect(
      createPlanUseCase(
        {
          currencyCode: 'MAD',
          durationMonths: 1,
          name: 'Netflix Standard',
          planType: 'shared',
          price: '99.99',
          serviceId: 'svc_missing',
        },
        adminContext,
        {
          createId: () => 'pln_test',
          findServiceById: async () => null,
          insertPlan: async () => {
            insertPlanCalls += 1;
            return planRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      code: 'PLAN_SERVICE_NOT_FOUND',
      statusCode: 404,
    });

    expect(insertPlanCalls).toBe(0);
  });

  it('rejects when the referenced service is inactive', async () => {
    let insertPlanCalls = 0;

    await expect(
      createPlanUseCase(
        {
          currencyCode: 'MAD',
          durationMonths: 1,
          name: 'Netflix Standard',
          planType: 'shared',
          price: '99.99',
          serviceId: 'svc_test',
        },
        adminContext,
        {
          createId: () => 'pln_test',
          findServiceById: async () => inactiveServiceModel,
          insertPlan: async () => {
            insertPlanCalls += 1;
            return planRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      code: 'PLAN_SERVICE_INACTIVE',
      statusCode: 409,
    });

    expect(insertPlanCalls).toBe(0);
  });

  it('rejects when the repository cannot create the plan', async () => {
    await expect(
      createPlanUseCase(
        {
          currencyCode: 'MAD',
          durationMonths: 1,
          name: 'Netflix Standard',
          planType: 'shared',
          price: '99.99',
          serviceId: 'svc_test',
        },
        adminContext,
        {
          createId: () => 'pln_test',
          findServiceById: async () => activeServiceModel,
          insertPlan: async () => null,
        }
      )
    ).rejects.toMatchObject({
      code: 'PLAN_CREATE_FAILED',
      statusCode: 500,
    });
  });

  it('creates a service-backed plan for an admin user', async () => {
    const plan = await createPlanUseCase(
      {
        currencyCode: 'MAD',
        durationMonths: 1,
        name: 'Netflix Standard',
        planType: 'shared',
        price: '99.99',
        serviceId: 'svc_test',
      },
      adminContext,
      {
        createId: () => 'pln_test',
        findServiceById: async () => activeServiceModel,
        insertPlan: async (input) => ({
          ...planRecord,
          ...input,
          id: input.id,
          name: input.name,
          serviceId: input.serviceId,
        }),
      }
    );

    expect(plan.id).toBe('pln_test');
    expect(plan.name).toBe('Netflix Standard');
    expect(plan.serviceId).toBe('svc_test');
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
