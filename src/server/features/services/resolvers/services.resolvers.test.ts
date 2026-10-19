import { Kind } from 'graphql';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { servicesResolvers } from '@/server/features/services/resolvers/services.resolvers';
import { servicesTypeDefs } from '@/server/features/services/schemas/graphql/services.schema';

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

const anonymousContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

describe('services GraphQL surface', () => {
  it('exposes the service queries and mutations in the schema', () => {
    expect(servicesTypeDefs).toContain('service(id: ID!): Service');
    expect(servicesTypeDefs).toContain(
      'services(page: Int = 1, pageSize: Int = 20): ServiceConnection!'
    );
    expect(servicesTypeDefs).toContain('archiveService(id: ID!): Service!');
    expect(servicesTypeDefs).toContain('updateService(input: UpdateServiceInput!): Service!');
    expect(servicesTypeDefs).toContain('restoreService(id: ID!): Service!');
  });

  it('rejects invalid createService input before the use case layer', async () => {
    await expect(
      servicesResolvers.Mutation.createService(
        undefined,
        {
          input: {
            category: 'video',
            name: '   ',
          },
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects invalid updateService input before the use case layer', async () => {
    await expect(
      servicesResolvers.Mutation.updateService(
        undefined,
        {
          input: {
            id: 'svc_test',
          },
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects restoreService for non-admin users', async () => {
    await expect(
      servicesResolvers.Mutation.restoreService(
        undefined,
        {
          id: 'svc_test',
        },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });
  });

  it('rejects archiveService for non-admin users', async () => {
    await expect(
      servicesResolvers.Mutation.archiveService(
        undefined,
        {
          id: 'svc_test',
        },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });
  });

  it('rejects service(id) for unauthenticated users', async () => {
    await expect(
      servicesResolvers.Query.service(
        undefined,
        {
          id: 'svc_test',
        },
        anonymousContext
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'UNAUTHENTICATED',
      },
      message: 'Authentication required',
    });
  });

  it('rejects invalid pagination before the list query reaches the use case layer', async () => {
    await expect(
      servicesResolvers.Query.services(
        undefined,
        {
          page: 0,
          pageSize: 20,
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('parses nested JSON literals with the custom scalar', () => {
    const parsed = servicesResolvers.JSON.parseLiteral({
      fields: [
        {
          kind: Kind.OBJECT_FIELD,
          name: { kind: Kind.NAME, value: 'enabled' },
          value: { kind: Kind.BOOLEAN, value: true },
        },
        {
          kind: Kind.OBJECT_FIELD,
          name: { kind: Kind.NAME, value: 'tags' },
          value: {
            kind: Kind.LIST,
            values: [
              { kind: Kind.STRING, value: 'video' },
              { kind: Kind.INT, value: '2' },
            ],
          },
        },
      ],
      kind: Kind.OBJECT,
    });

    expect(parsed).toEqual({
      enabled: true,
      tags: ['video', 2],
    });
  });
});
