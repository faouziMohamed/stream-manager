import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { authResolvers } from '@/server/features/auth/resolvers/auth.resolvers';
import { authTypeDefs } from '@/server/features/auth/schemas/graphql/auth.schema';

const nullSessionContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: null,
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

describe('auth GraphQL surface', () => {
  it('exposes auth mutations in the schema', () => {
    expect(authTypeDefs).toContain('logout: Boolean!');
    expect(authTypeDefs).toContain('logoutAllDevices: Boolean!');
    expect(authTypeDefs).toContain('revokeSession(input: RevokeSessionInput!): Boolean!');
  });

  it('exposes the sessions query in the schema', () => {
    expect(authTypeDefs).toContain('sessions: [SessionDto!]!');
    expect(authTypeDefs).toContain('type SessionDto');
    expect(authTypeDefs).toContain('current: Boolean!');
  });

  it('does not expose tokens, refresh tokens or API keys', () => {
    expect(authTypeDefs).not.toContain('accessToken');
    expect(authTypeDefs).not.toContain('refreshToken');
    expect(authTypeDefs).not.toContain('ApiKey');
  });

  it('does not expose login mutations — Auth.js calls the use-cases in-process', () => {
    expect(authTypeDefs).not.toContain('login(');
    expect(authTypeDefs).not.toContain('loginWithOAuth(');
    expect(authResolvers.Mutation).not.toHaveProperty('login');
    expect(authResolvers.Mutation).not.toHaveProperty('loginWithOAuth');
  });

  it('rejects logout when unauthenticated', async () => {
    await expect(
      authResolvers.Mutation.logout(undefined, {}, unauthenticatedContext)
    ).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });

  it('rejects logout when sessionId is null', async () => {
    await expect(
      authResolvers.Mutation.logout(undefined, {}, nullSessionContext)
    ).rejects.toMatchObject({
      extensions: { code: 'SESSION_REQUIRED', statusCode: 400 },
    });
  });

  it('rejects logoutAllDevices when unauthenticated', async () => {
    await expect(
      authResolvers.Mutation.logoutAllDevices(undefined, {}, unauthenticatedContext)
    ).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });

  it('rejects sessions query when unauthenticated', async () => {
    await expect(
      authResolvers.Query.sessions(undefined, {}, unauthenticatedContext)
    ).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });

  it('rejects revokeSession when unauthenticated', async () => {
    await expect(
      authResolvers.Mutation.revokeSession(
        undefined,
        { input: { id: 'ses_123' } },
        unauthenticatedContext
      )
    ).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });
});
