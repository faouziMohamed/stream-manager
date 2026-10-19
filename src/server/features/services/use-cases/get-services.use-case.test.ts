import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import {
  getServiceUseCase,
  getServicesUseCase,
} from '@/server/features/services/use-cases/get-services.use-case';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';

const userContext: GqlContext = {
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

const anonymousContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

describe('getServicesUseCase', () => {
  it('rejects unauthenticated access before reaching the repository layer', async () => {
    let findServicesCalls = 0;

    await expect(
      getServicesUseCase(
        {
          page: 1,
          pageSize: 20,
        },
        anonymousContext,
        {
          findServices: async () => {
            findServicesCalls += 1;
            return {
              items: [serviceModel],
              total: 1,
            };
          },
          resolveImageUrl: async () => '/storage/mock',
        }
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'UNAUTHENTICATED',
      },
      message: 'Authentication required',
    });

    expect(findServicesCalls).toBe(0);
  });

  it('returns paginated service DTOs', async () => {
    const result = await getServicesUseCase(
      {
        page: 1,
        pageSize: 20,
      },
      userContext,
      {
        findServices: async () => ({
          items: [serviceModel],
          total: 1,
        }),
        resolveImageUrl: async (key) => `/storage/${key}`,
      }
    );

    expect(result.pageInfo).toEqual({
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });
    expect(result.items[0]).toEqual({
      category: 'video',
      createdAt: '2026-01-01T00:00:00.000Z',
      descriptionContent: null,
      id: 'svc_test',
      imageKey: null,
      imageUrl: null,
      isActive: true,
      name: 'Netflix',
      supportsProfiles: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('returns an empty page when the repository has no services', async () => {
    const result = await getServicesUseCase(
      {
        page: 2,
        pageSize: 10,
      },
      userContext,
      {
        findServices: async () => ({
          items: [],
          total: 0,
        }),
        resolveImageUrl: async () => '/storage/mock',
      }
    );

    expect(result).toEqual({
      items: [],
      pageInfo: {
        page: 2,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      },
    });
  });
});

describe('getServiceUseCase', () => {
  it('rejects unauthenticated access before reaching the repository layer', async () => {
    let findServiceByIdCalls = 0;

    await expect(
      getServiceUseCase('svc_test', anonymousContext, {
        findServiceById: async () => {
          findServiceByIdCalls += 1;
          return serviceModel;
        },
        resolveImageUrl: async () => '/storage/mock',
      })
    ).rejects.toMatchObject({
      extensions: {
        code: 'UNAUTHENTICATED',
      },
      message: 'Authentication required',
    });

    expect(findServiceByIdCalls).toBe(0);
  });

  it('returns a service DTO for an authenticated user', async () => {
    const service = await getServiceUseCase('svc_test', userContext, {
      findServiceById: async () => ({
        ...serviceModel,
        imageKey: 'services/netflix.png',
      }),
      resolveImageUrl: async (key) => `https://cdn.example.com/${key}`,
    });

    expect(service).toEqual({
      category: 'video',
      createdAt: '2026-01-01T00:00:00.000Z',
      descriptionContent: null,
      id: 'svc_test',
      imageKey: 'services/netflix.png',
      imageUrl: 'https://cdn.example.com/services/netflix.png',
      isActive: true,
      name: 'Netflix',
      supportsProfiles: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('throws when the service does not exist', async () => {
    await expect(
      getServiceUseCase('svc_missing', userContext, {
        findServiceById: async () => null,
        resolveImageUrl: async () => '/storage/mock',
      })
    ).rejects.toMatchObject({
      code: 'SERVICE_NOT_FOUND',
      statusCode: 404,
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
