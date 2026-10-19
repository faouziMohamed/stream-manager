import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';
import { restoreServiceUseCase } from '@/server/features/services/use-cases/restore-service.use-case';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_test',
  user: {
    avatar: null,
    email: 'admin@example.com',
    id: 'usr_test',
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

describe('restoreServiceUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findServiceByIdCalls = 0;
    let restoreServiceCalls = 0;

    await expect(
      restoreServiceUseCase('svc_test', userContext, {
        findServiceById: async () => {
          findServiceByIdCalls += 1;
          return archivedServiceModel;
        },
        restoreService: async () => {
          restoreServiceCalls += 1;
          return archivedServiceModel;
        },
      })
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });

    expect(findServiceByIdCalls).toBe(0);
    expect(restoreServiceCalls).toBe(0);
  });

  it('rejects restore for a missing service', async () => {
    let restoreServiceCalls = 0;

    await expect(
      restoreServiceUseCase('svc_missing', adminContext, {
        findServiceById: async () => null,
        restoreService: async () => {
          restoreServiceCalls += 1;
          return archivedServiceModel;
        },
      })
    ).rejects.toMatchObject({
      code: 'SERVICE_NOT_FOUND',
      statusCode: 404,
    });

    expect(restoreServiceCalls).toBe(0);
  });

  it('rejects restore for a service that is not archived', async () => {
    let restoreServiceCalls = 0;

    await expect(
      restoreServiceUseCase('svc_test', adminContext, {
        findServiceById: async () => activeServiceModel,
        restoreService: async () => {
          restoreServiceCalls += 1;
          return activeServiceModel;
        },
      })
    ).rejects.toMatchObject({
      code: 'SERVICE_NOT_ARCHIVED',
      statusCode: 409,
    });

    expect(restoreServiceCalls).toBe(0);
  });

  it('rejects when the restore repository returns null', async () => {
    await expect(
      restoreServiceUseCase('svc_test', adminContext, {
        findServiceById: async () => archivedServiceModel,
        restoreService: async () => null,
      })
    ).rejects.toMatchObject({
      code: 'SERVICE_RESTORE_FAILED',
      statusCode: 500,
    });
  });

  it('restores an archived service for an admin user', async () => {
    const restoredService = await restoreServiceUseCase('svc_test', adminContext, {
      findServiceById: async () => archivedServiceModel,
      restoreService: async (id) => ({
        ...activeServiceModel,
        id,
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
    });

    expect(restoredService.deletedAt).toBeNull();
    expect(restoredService.isActive).toBe(true);
    expect(restoredService.updatedAt.toISOString()).toBe('2026-02-01T00:00:00.000Z');
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

const archivedServiceModel: ServiceModel = {
  ...activeServiceModel,
  deletedAt: new Date('2026-01-15T00:00:00.000Z'),
  isActive: false,
};
