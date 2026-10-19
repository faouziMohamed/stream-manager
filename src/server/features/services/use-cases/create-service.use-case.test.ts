import { AppError } from '@/server/common/errors/app-error';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { createServiceUseCase } from '@/server/features/services/use-cases/create-service.use-case';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';

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

describe('createServiceUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findServiceByNameCalls = 0;
    let insertServiceCalls = 0;

    await expect(
      createServiceUseCase(
        {
          category: 'video',
          name: 'Netflix',
          supportsProfiles: true,
        },
        userContext,
        {
          createId: () => 'svc_test',
          findServiceByName: async () => {
            findServiceByNameCalls += 1;
            return null;
          },
          insertService: async () => {
            insertServiceCalls += 1;
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

    expect(findServiceByNameCalls).toBe(0);
    expect(insertServiceCalls).toBe(0);
  });

  it('rejects duplicate service names', async () => {
    let insertServiceCalls = 0;

    await expect(
      createServiceUseCase(
        {
          category: 'video',
          name: 'Netflix',
          supportsProfiles: true,
        },
        adminContext,
        {
          createId: () => 'svc_test',
          findServiceByName: async () => serviceModel,
          insertService: async () => {
            insertServiceCalls += 1;
            return serviceModel;
          },
        }
      )
    ).rejects.toThrow(AppError);

    expect(insertServiceCalls).toBe(0);
  });

  it('rejects when the repository cannot create the service', async () => {
    await expect(
      createServiceUseCase(
        {
          category: 'video',
          name: 'Netflix',
          supportsProfiles: true,
        },
        adminContext,
        {
          createId: () => 'svc_test',
          findServiceByName: async () => null,
          insertService: async () => null,
        }
      )
    ).rejects.toMatchObject({
      code: 'SERVICE_CREATE_FAILED',
      statusCode: 500,
    });
  });

  it('creates a service for an admin user', async () => {
    let insertedName = '';
    let insertedDescriptionContent: unknown = 'unset';
    let insertedImageKey: string | null | undefined = 'unset';

    const service = await createServiceUseCase(
      {
        category: 'video',
        descriptionContent: null,
        imageKey: null,
        name: 'Netflix',
        supportsProfiles: true,
      },
      adminContext,
      {
        createId: () => 'svc_test',
        findServiceByName: async () => null,
        insertService: async (input) => {
          insertedName = input.name;
          insertedDescriptionContent = input.descriptionContent;
          insertedImageKey = input.imageKey;
          return {
            ...serviceModel,
            id: input.id,
            name: input.name,
          };
        },
      }
    );

    expect(insertedName).toBe('Netflix');
    expect(insertedDescriptionContent).toBeNull();
    expect(insertedImageKey).toBeNull();
    expect(service.id).toBe('svc_test');
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
