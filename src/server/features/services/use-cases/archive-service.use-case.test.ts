import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';
import { archiveServiceUseCase } from '@/server/features/services/use-cases/archive-service.use-case';

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

describe('archiveServiceUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findServiceByIdCalls = 0;
    let countActiveMembershipsForServiceCalls = 0;
    let softDeleteServiceCalls = 0;

    await expect(
      archiveServiceUseCase('svc_test', userContext, {
        countActiveMembershipsForService: async () => {
          countActiveMembershipsForServiceCalls += 1;
          return 0;
        },
        findServiceById: async () => {
          findServiceByIdCalls += 1;
          return activeServiceModel;
        },
        softDeleteService: async () => {
          softDeleteServiceCalls += 1;
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
    expect(countActiveMembershipsForServiceCalls).toBe(0);
    expect(softDeleteServiceCalls).toBe(0);
  });

  it('rejects archive for a missing service', async () => {
    let countActiveMembershipsForServiceCalls = 0;
    let softDeleteServiceCalls = 0;

    await expect(
      archiveServiceUseCase('svc_missing', adminContext, {
        countActiveMembershipsForService: async () => {
          countActiveMembershipsForServiceCalls += 1;
          return 0;
        },
        findServiceById: async () => null,
        softDeleteService: async () => {
          softDeleteServiceCalls += 1;
          return archivedServiceModel;
        },
      })
    ).rejects.toMatchObject({
      code: 'SERVICE_NOT_FOUND',
      statusCode: 404,
    });

    expect(countActiveMembershipsForServiceCalls).toBe(0);
    expect(softDeleteServiceCalls).toBe(0);
  });

  it('rejects archive for an already archived service', async () => {
    let countActiveMembershipsForServiceCalls = 0;
    let softDeleteServiceCalls = 0;

    await expect(
      archiveServiceUseCase('svc_test', adminContext, {
        countActiveMembershipsForService: async () => {
          countActiveMembershipsForServiceCalls += 1;
          return 0;
        },
        findServiceById: async () => archivedServiceModel,
        softDeleteService: async () => {
          softDeleteServiceCalls += 1;
          return archivedServiceModel;
        },
      })
    ).rejects.toMatchObject({
      code: 'SERVICE_ALREADY_ARCHIVED',
      statusCode: 409,
    });

    expect(countActiveMembershipsForServiceCalls).toBe(0);
    expect(softDeleteServiceCalls).toBe(0);
  });

  it('rejects archive when active memberships still use the service', async () => {
    let softDeleteServiceCalls = 0;

    await expect(
      archiveServiceUseCase('svc_test', adminContext, {
        countActiveMembershipsForService: async () => 2,
        findServiceById: async () => activeServiceModel,
        softDeleteService: async () => {
          softDeleteServiceCalls += 1;
          return archivedServiceModel;
        },
      })
    ).rejects.toMatchObject({
      code: 'SERVICE_HAS_ACTIVE_MEMBERSHIPS',
      statusCode: 409,
    });

    expect(softDeleteServiceCalls).toBe(0);
  });

  it('rejects when the repository cannot archive the service', async () => {
    await expect(
      archiveServiceUseCase('svc_test', adminContext, {
        countActiveMembershipsForService: async () => 0,
        findServiceById: async () => activeServiceModel,
        softDeleteService: async () => null,
      })
    ).rejects.toMatchObject({
      code: 'SERVICE_ARCHIVE_FAILED',
      statusCode: 500,
    });
  });

  it('archives an active service for an admin user', async () => {
    const archivedService = await archiveServiceUseCase('svc_test', adminContext, {
      countActiveMembershipsForService: async () => 0,
      findServiceById: async () => activeServiceModel,
      softDeleteService: async (id) => ({
        ...archivedServiceModel,
        id,
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
    });

    expect(archivedService.deletedAt?.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    expect(archivedService.isActive).toBe(false);
    expect(archivedService.updatedAt.toISOString()).toBe('2026-02-01T00:00:00.000Z');
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
