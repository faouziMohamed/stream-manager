import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { Encryptor } from '@/server/common/security/encryptor';
import { createStreamingProfileUseCase } from '@/server/features/streaming-accounts/use-cases/create-streaming-profile.use-case';

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

const profileRecord = {
  accountId: 'acc_test',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  id: 'prf_test',
  isAssigned: false,
  name: 'Profile 1',
  pinEncrypted: null,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const testEncryptor = {
  decrypt: (value: string) => value.replace('enc_', ''),
  encrypt: (value: string) => `enc_${value}`,
} as unknown as Encryptor;

describe('createStreamingProfileUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findStreamingAccountByIdCalls = 0;
    let insertStreamingProfileCalls = 0;

    await expect(
      createStreamingProfileUseCase({ accountId: 'acc_test', name: 'Profile 1' }, userContext, {
        createId: () => 'prf_test',
        encryptor: testEncryptor,
        findProfilesByAccountId: async () => [],
        findStreamingAccountById: async () => {
          findStreamingAccountByIdCalls += 1;
          return { supportsProfiles: true, isActive: true, maxProfiles: 5 };
        },
        insertStreamingProfile: async () => {
          insertStreamingProfileCalls += 1;
          return profileRecord;
        },
      })
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });

    expect(findStreamingAccountByIdCalls).toBe(0);
    expect(insertStreamingProfileCalls).toBe(0);
  });

  it('rejects when account is not found', async () => {
    let insertStreamingProfileCalls = 0;

    await expect(
      createStreamingProfileUseCase({ accountId: 'acc_missing', name: 'Profile 1' }, adminContext, {
        createId: () => 'prf_test',
        encryptor: testEncryptor,
        findProfilesByAccountId: async () => [],
        findStreamingAccountById: async () => null,
        insertStreamingProfile: async () => {
          insertStreamingProfileCalls += 1;
          return profileRecord;
        },
      })
    ).rejects.toMatchObject({
      code: 'ACCOUNT_NOT_FOUND',
      statusCode: 404,
    });

    expect(insertStreamingProfileCalls).toBe(0);
  });

  it('rejects when account is inactive', async () => {
    let insertStreamingProfileCalls = 0;

    await expect(
      createStreamingProfileUseCase({ accountId: 'acc_test', name: 'Profile 1' }, adminContext, {
        createId: () => 'prf_test',
        encryptor: testEncryptor,
        findProfilesByAccountId: async () => [],
        findStreamingAccountById: async () => ({
          supportsProfiles: true,
          isActive: false,
          maxProfiles: 5,
        }),
        insertStreamingProfile: async () => {
          insertStreamingProfileCalls += 1;
          return profileRecord;
        },
      })
    ).rejects.toMatchObject({
      code: 'ACCOUNT_INACTIVE',
      statusCode: 409,
    });

    expect(insertStreamingProfileCalls).toBe(0);
  });

  it('creates profile with PIN encrypted', async () => {
    let capturedPinEncrypted: unknown = null;

    const profile = await createStreamingProfileUseCase(
      { accountId: 'acc_test', name: 'Profile 1', pin: '1234' },
      adminContext,
      {
        createId: () => 'prf_test',
        encryptor: testEncryptor,
        findProfilesByAccountId: async () => [],
        findStreamingAccountById: async () => ({
          supportsProfiles: true,
          isActive: true,
          maxProfiles: 5,
        }),
        insertStreamingProfile: async (input) => {
          capturedPinEncrypted = input.pinEncrypted;
          return {
            ...profileRecord,
            ...input,
            pinEncrypted: input.pinEncrypted ?? null,
          };
        },
      }
    );

    expect(capturedPinEncrypted).toBe('enc_1234');
    expect(profile.pinEncrypted).toBe('enc_1234');
  });

  it('creates profile without PIN', async () => {
    let capturedPinEncrypted: unknown = 'unset';

    const profile = await createStreamingProfileUseCase(
      { accountId: 'acc_test', name: 'Profile 1' },
      adminContext,
      {
        createId: () => 'prf_test',
        encryptor: testEncryptor,
        findProfilesByAccountId: async () => [],
        findStreamingAccountById: async () => ({
          supportsProfiles: true,
          isActive: true,
          maxProfiles: 5,
        }),
        insertStreamingProfile: async (input) => {
          capturedPinEncrypted = input.pinEncrypted;
          return {
            ...profileRecord,
            ...input,
            pinEncrypted: input.pinEncrypted ?? null,
          };
        },
      }
    );

    expect(capturedPinEncrypted).toBeNull();
    expect(profile.pinEncrypted).toBeNull();
  });

  it('rejects when repository insert fails', async () => {
    await expect(
      createStreamingProfileUseCase({ accountId: 'acc_test', name: 'Profile 1' }, adminContext, {
        createId: () => 'prf_test',
        encryptor: testEncryptor,
        findProfilesByAccountId: async () => [],
        findStreamingAccountById: async () => ({
          supportsProfiles: true,
          isActive: true,
          maxProfiles: 5,
        }),
        insertStreamingProfile: async () => null,
      })
    ).rejects.toMatchObject({
      code: 'PROFILE_CREATE_FAILED',
      statusCode: 500,
    });
  });
});
