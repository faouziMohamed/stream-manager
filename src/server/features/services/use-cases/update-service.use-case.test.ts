import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';
import { updateServiceUseCase } from '@/server/features/services/use-cases/update-service.use-case';

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

describe('updateServiceUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findServiceByIdCalls = 0;
    let findServiceByNameCalls = 0;
    let updateServiceCalls = 0;

    await expect(
      updateServiceUseCase(
        {
          id: 'svc_test',
          name: 'Prime Video',
        },
        userContext,
        {
          findServiceById: async () => {
            findServiceByIdCalls += 1;
            return serviceModel;
          },
          findServiceByName: async () => {
            findServiceByNameCalls += 1;
            return null;
          },
          updateService: async () => {
            updateServiceCalls += 1;
            return serviceModel;
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
    expect(findServiceByNameCalls).toBe(0);
    expect(updateServiceCalls).toBe(0);
  });

  it('rejects updates for a missing service', async () => {
    let findServiceByNameCalls = 0;
    let updateServiceCalls = 0;

    await expect(
      updateServiceUseCase(
        {
          id: 'svc_missing',
          name: 'Prime Video',
        },
        adminContext,
        {
          findServiceById: async () => null,
          findServiceByName: async () => {
            findServiceByNameCalls += 1;
            return null;
          },
          updateService: async () => {
            updateServiceCalls += 1;
            return serviceModel;
          },
        }
      )
    ).rejects.toMatchObject({
      code: 'SERVICE_NOT_FOUND',
      statusCode: 404,
    });

    expect(findServiceByNameCalls).toBe(0);
    expect(updateServiceCalls).toBe(0);
  });

  it('rejects duplicate names owned by another service', async () => {
    await expect(
      updateServiceUseCase(
        {
          id: 'svc_test',
          name: 'Prime Video',
        },
        adminContext,
        {
          findServiceById: async () => serviceModel,
          findServiceByName: async () => ({
            ...serviceModel,
            id: 'svc_other',
            name: 'Prime Video',
          }),
          updateService: async () => serviceModel,
        }
      )
    ).rejects.toMatchObject({
      code: 'SERVICE_NAME_EXISTS',
      statusCode: 409,
    });
  });

  it('updates the service for an admin user', async () => {
    const updatedService = await updateServiceUseCase(
      {
        id: 'svc_test',
        isActive: false,
        name: 'Prime Video',
      },
      adminContext,
      {
        findServiceById: async () => serviceModel,
        findServiceByName: async () => null,
        updateService: async (id, input) => ({
          ...serviceModel,
          ...input,
          id,
          isActive: input.isActive ?? serviceModel.isActive,
          name: input.name ?? serviceModel.name,
          updatedAt: new Date('2026-02-01T00:00:00.000Z'),
        }),
      }
    );

    expect(updatedService.name).toBe('Prime Video');
    expect(updatedService.isActive).toBe(false);
    expect(updatedService.updatedAt.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('skips duplicate-name lookup when the name is not being changed', async () => {
    let findServiceByNameCalls = 0;

    const updatedService = await updateServiceUseCase(
      {
        category: 'music',
        id: 'svc_test',
      },
      adminContext,
      {
        findServiceById: async () => serviceModel,
        findServiceByName: async () => {
          findServiceByNameCalls += 1;
          return null;
        },
        updateService: async (id, input) => ({
          ...serviceModel,
          ...input,
          category: input.category ?? serviceModel.category,
          id,
        }),
      }
    );

    expect(findServiceByNameCalls).toBe(0);
    expect(updatedService.category).toBe('music');
  });

  it('rejects when the update repository returns null', async () => {
    await expect(
      updateServiceUseCase(
        {
          id: 'svc_test',
          name: 'Prime Video',
        },
        adminContext,
        {
          findServiceById: async () => serviceModel,
          findServiceByName: async () => null,
          updateService: async () => null,
        }
      )
    ).rejects.toMatchObject({
      code: 'SERVICE_UPDATE_FAILED',
      statusCode: 500,
    });
  });
});

const serviceModel: ServiceModel = {
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
