import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { streamingAccountsResolvers } from '@/server/features/streaming-accounts/resolvers/streaming-accounts.resolvers';
import { streamingAccountsTypeDefs } from '@/server/features/streaming-accounts/schemas/graphql/streaming-accounts.schema';

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

const accountantContext: GqlContext = {
  isAccountant: true,
  isAdmin: false,
  sessionId: 'ses_accountant',
  user: {
    avatar: null,
    email: 'accountant@example.com',
    id: 'usr_accountant',
    name: 'Accountant',
    role: 'accountant',
  },
};

describe('streaming-accounts GraphQL surface', () => {
  it('exposes streaming-account queries and mutations in the schema', () => {
    expect(streamingAccountsTypeDefs).toContain('streamingAccounts: [StreamingAccount!]!');
    expect(streamingAccountsTypeDefs).toContain('streamingAccount(id: ID!): StreamingAccount');
    expect(streamingAccountsTypeDefs).toContain(
      'streamingProfiles(accountId: ID!): [StreamingProfile!]!'
    );
    expect(streamingAccountsTypeDefs).toMatch(
      /type StreamingProfile {[\S\s]*assignmentId: ID[\S\s]*membershipId: ID[\S\s]*}/
    );
    expect(streamingAccountsTypeDefs).toMatch(
      /createStreamingAccount\(\s*input: CreateStreamingAccountInput!\s*\): StreamingAccount!/
    );
    expect(streamingAccountsTypeDefs).toMatch(
      /createStreamingProfile\(\s*input: CreateStreamingProfileInput!\s*\): StreamingProfile!/
    );
    expect(streamingAccountsTypeDefs).toMatch(
      /assignProfileToMembership\(\s*input: AssignProfileToMembershipInput!\s*\): StreamingProfileAssignment!/
    );
    expect(streamingAccountsTypeDefs).toMatch(
      /unassignProfile\(\s*input: UnassignProfileInput!\s*\): StreamingProfile!/
    );
  });

  it('rejects invalid createStreamingAccount input before the use case layer', async () => {
    await expect(
      streamingAccountsResolvers.Mutation.createStreamingAccount(
        undefined,
        { input: { label: '   ', serviceId: 'svc_netflix' } },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects createStreamingAccount for non-admin users', async () => {
    await expect(
      streamingAccountsResolvers.Mutation.createStreamingAccount(
        undefined,
        { input: { label: 'Netflix Main', serviceId: 'svc_netflix' } },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });
  });

  it('rejects invalid createStreamingProfile input before the use case layer', async () => {
    await expect(
      streamingAccountsResolvers.Mutation.createStreamingProfile(
        undefined,
        { input: { accountId: 'acc_test', name: '   ' } },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects createStreamingProfile for non-admin users', async () => {
    await expect(
      streamingAccountsResolvers.Mutation.createStreamingProfile(
        undefined,
        { input: { accountId: 'acc_test', name: 'Profile 1' } },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });
  });

  it('rejects invalid assignProfileToMembership input before the use case layer', async () => {
    await expect(
      streamingAccountsResolvers.Mutation.assignProfileToMembership(
        undefined,
        {
          input: {
            accountId: '   ',
            membershipId: 'mbr_test',
            profileId: 'prf_test',
          },
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects assignProfileToMembership for non-admin users', async () => {
    await expect(
      streamingAccountsResolvers.Mutation.assignProfileToMembership(
        undefined,
        {
          input: {
            accountId: 'acc_test',
            membershipId: 'mbr_test',
            profileId: 'prf_test',
          },
        },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });
  });

  it('rejects invalid unassignProfile input before the use case layer', async () => {
    await expect(
      streamingAccountsResolvers.Mutation.unassignProfile(
        undefined,
        { input: { assignmentId: '   ' } },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects unassignProfile for non-admin users', async () => {
    await expect(
      streamingAccountsResolvers.Mutation.unassignProfile(
        undefined,
        { input: { assignmentId: 'asg_test' } },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });
  });

  it('rejects streamingAccounts for non-moderator users', async () => {
    await expect(
      streamingAccountsResolvers.Query.streamingAccounts(undefined, {}, userContext)
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });
  });

  it('allows accountant users past authorization on streamingAccounts', async () => {
    try {
      await streamingAccountsResolvers.Query.streamingAccounts(undefined, {}, accountantContext);
    } catch (error_: unknown) {
      const error = error_ as Record<string, unknown>;
      if (error && typeof error === 'object' && 'extensions' in error) {
        const ext = (error as { extensions: { code: string } }).extensions;
        if (ext?.code === 'FORBIDDEN') {
          throw new Error('Accountant should not get FORBIDDEN');
        }
      }
    }
  });

  it('rejects streamingAccount for non-moderator users', async () => {
    await expect(
      streamingAccountsResolvers.Query.streamingAccount(undefined, { id: 'acc_test' }, userContext)
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });
  });

  it('rejects streamingProfiles for non-moderator users', async () => {
    await expect(
      streamingAccountsResolvers.Query.streamingProfiles(
        undefined,
        { accountId: 'acc_test' },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });
  });

  it('allows accountant users past authorization on streamingProfiles', async () => {
    try {
      await streamingAccountsResolvers.Query.streamingProfiles(
        undefined,
        { accountId: 'acc_test' },
        accountantContext
      );
    } catch (error_: unknown) {
      const error = error_ as Record<string, unknown>;
      if (error && typeof error === 'object' && 'extensions' in error) {
        const ext = (error as { extensions: { code: string } }).extensions;
        if (ext?.code === 'FORBIDDEN') {
          throw new Error('Accountant should not get FORBIDDEN');
        }
      }
    }
  });
});
