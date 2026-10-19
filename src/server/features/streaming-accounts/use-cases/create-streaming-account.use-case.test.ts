import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { Encryptor } from '@/server/common/security/encryptor';
import type { CreateStreamingAccountInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import { createStreamingAccountUseCase } from '@/server/features/streaming-accounts/use-cases/create-streaming-account.use-case';

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

const accountRecord = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: 'netflix@example.com',
  id: 'acc_test',
  isActive: true,
  label: 'Netflix Main',
  maxProfiles: 4,
  passwordEncrypted: null,
  serviceId: 'svc_netflix',
  supportsProfiles: true,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const testEncryptor = {
  decrypt: (value: string) => value.replace('enc_', ''),
  encrypt: (value: string) => `enc_${value}`,
} as unknown as Encryptor;

function accountInput(
  overrides: Partial<CreateStreamingAccountInput> = {}
): CreateStreamingAccountInput {
  return {
    label: 'Netflix Main',
    maxProfiles: 4,
    serviceId: 'svc_netflix',
    supportsProfiles: true,
    ...overrides,
  };
}

describe('createStreamingAccountUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findServiceByIdCalls = 0;
    let insertStreamingAccountCalls = 0;

    await expect(
      createStreamingAccountUseCase(accountInput(), userContext, {
        createId: () => 'acc_test',
        encryptor: testEncryptor,
        findServiceById: async () => {
          findServiceByIdCalls += 1;
          return { isActive: true };
        },
        insertStreamingAccount: async () => {
          insertStreamingAccountCalls += 1;
          return accountRecord;
        },
      })
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });

    expect(findServiceByIdCalls).toBe(0);
    expect(insertStreamingAccountCalls).toBe(0);
  });

  it('rejects when service is not found', async () => {
    let insertStreamingAccountCalls = 0;

    await expect(
      createStreamingAccountUseCase(accountInput({ serviceId: 'svc_missing' }), adminContext, {
        createId: () => 'acc_test',
        encryptor: testEncryptor,
        findServiceById: async () => null,
        insertStreamingAccount: async () => {
          insertStreamingAccountCalls += 1;
          return accountRecord;
        },
      })
    ).rejects.toMatchObject({
      code: 'SERVICE_NOT_FOUND',
      statusCode: 404,
    });

    expect(insertStreamingAccountCalls).toBe(0);
  });

  it('rejects when service is inactive', async () => {
    let insertStreamingAccountCalls = 0;

    await expect(
      createStreamingAccountUseCase(accountInput(), adminContext, {
        createId: () => 'acc_test',
        encryptor: testEncryptor,
        findServiceById: async () => ({ isActive: false }),
        insertStreamingAccount: async () => {
          insertStreamingAccountCalls += 1;
          return accountRecord;
        },
      })
    ).rejects.toMatchObject({
      code: 'SERVICE_INACTIVE',
      statusCode: 409,
    });

    expect(insertStreamingAccountCalls).toBe(0);
  });

  it('creates account with password encrypted', async () => {
    let capturedPasswordEncrypted: unknown = null;

    const account = await createStreamingAccountUseCase(
      accountInput({
        email: 'admin@netflix.com',
        password: 'secret123',
      }),
      adminContext,
      {
        createId: () => 'acc_test',
        encryptor: testEncryptor,
        findServiceById: async () => ({ isActive: true }),
        insertStreamingAccount: async (input) => {
          capturedPasswordEncrypted = input.passwordEncrypted;
          return {
            ...accountRecord,
            ...input,
            passwordEncrypted: input.passwordEncrypted ?? null,
          };
        },
      }
    );

    expect(capturedPasswordEncrypted).toBe('enc_secret123');
    expect(account.passwordEncrypted).toBe('enc_secret123');
  });

  it('creates account without password', async () => {
    let capturedPasswordEncrypted: unknown = 'unset';

    const account = await createStreamingAccountUseCase(accountInput(), adminContext, {
      createId: () => 'acc_test',
      encryptor: testEncryptor,
      findServiceById: async () => ({ isActive: true }),
      insertStreamingAccount: async (input) => {
        capturedPasswordEncrypted = input.passwordEncrypted;
        return {
          ...accountRecord,
          ...input,
          passwordEncrypted: input.passwordEncrypted ?? null,
        };
      },
    });

    expect(capturedPasswordEncrypted).toBeNull();
    expect(account.passwordEncrypted).toBeNull();
  });

  it('creates account with default maxProfiles and supportsProfiles when not provided', async () => {
    let capturedInput: unknown = null;

    await createStreamingAccountUseCase(
      {
        label: 'Netflix Main',
        serviceId: 'svc_netflix',
      } as unknown as CreateStreamingAccountInput,
      adminContext,
      {
        createId: () => 'acc_test',
        encryptor: testEncryptor,
        findServiceById: async () => ({ isActive: true }),
        insertStreamingAccount: async (input) => {
          capturedInput = input;
          return {
            ...accountRecord,
            ...input,
            passwordEncrypted: input.passwordEncrypted ?? null,
          };
        },
      }
    );

    expect(capturedInput).toMatchObject({
      maxProfiles: 1,
      supportsProfiles: false,
    });
  });

  it('rejects when repository cannot create account', async () => {
    await expect(
      createStreamingAccountUseCase(accountInput(), adminContext, {
        createId: () => 'acc_test',
        encryptor: testEncryptor,
        findServiceById: async () => ({ isActive: true }),
        insertStreamingAccount: async () => null,
      })
    ).rejects.toMatchObject({
      code: 'ACCOUNT_CREATE_FAILED',
      statusCode: 500,
    });
  });
});
