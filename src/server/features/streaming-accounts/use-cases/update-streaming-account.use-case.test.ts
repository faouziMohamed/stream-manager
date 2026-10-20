import type { Encryptor } from '@/server/common/security/encryptor';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { UpdateStreamingAccountInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import type { StreamingAccountRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';
import { updateStreamingAccountUseCase } from '@/server/features/streaming-accounts/use-cases/update-streaming-account.use-case';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: { avatar: null, email: 'admin@example.com', id: 'usr_admin', name: 'Admin', role: 'admin' },
};

const userContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: 'ses_user',
  user: { avatar: null, email: 'user@example.com', id: 'usr_user', name: 'User', role: 'user' },
};

const existingAccount: StreamingAccountRecord = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: 'old@example.com',
  id: 'acc_test',
  isActive: true,
  label: 'Old label',
  maxProfiles: 2,
  passwordEncrypted: 'enc_old',
  serviceId: 'svc_netflix',
  supportsProfiles: false,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const testEncryptor = {
  encrypt: (value: string) => `enc_${value}`,
} as unknown as Encryptor;

function input(overrides: Partial<UpdateStreamingAccountInput> = {}): UpdateStreamingAccountInput {
  return { id: 'acc_test', ...overrides };
}

describe('updateStreamingAccountUseCase', () => {
  it('rejects non-admin users without reaching the repository', async () => {
    let findCalls = 0;

    await expect(
      updateStreamingAccountUseCase(input({ label: 'New' }), userContext, {
        encryptor: testEncryptor,
        findStreamingAccountById: async () => {
          findCalls += 1;
          return existingAccount;
        },
        updateStreamingAccount: async () => existingAccount,
      })
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });

    expect(findCalls).toBe(0);
  });

  it('rejects when account is not found', async () => {
    await expect(
      updateStreamingAccountUseCase(input(), adminContext, {
        encryptor: testEncryptor,
        findStreamingAccountById: async () => null,
        updateStreamingAccount: async () => null,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_FOUND', statusCode: 404 });
  });

  it('rejects when account is inactive', async () => {
    await expect(
      updateStreamingAccountUseCase(input(), adminContext, {
        encryptor: testEncryptor,
        findStreamingAccountById: async () => ({ ...existingAccount, isActive: false }),
        updateStreamingAccount: async () => null,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_FOUND', statusCode: 404 });
  });

  it('encrypts a new password when provided', async () => {
    let capturedPasswordEncrypted: unknown = 'unset';

    await updateStreamingAccountUseCase(input({ password: 'newpass' }), adminContext, {
      encryptor: testEncryptor,
      findStreamingAccountById: async () => existingAccount,
      updateStreamingAccount: async (_, update) => {
        capturedPasswordEncrypted = update.passwordEncrypted;
        return existingAccount;
      },
    });

    expect(capturedPasswordEncrypted).toBe('enc_newpass');
  });

  it('clears the password when an empty string is passed', async () => {
    let capturedPasswordEncrypted: unknown = 'unset';

    await updateStreamingAccountUseCase(input({ password: '' }), adminContext, {
      encryptor: testEncryptor,
      findStreamingAccountById: async () => existingAccount,
      updateStreamingAccount: async (_, update) => {
        capturedPasswordEncrypted = update.passwordEncrypted;
        return existingAccount;
      },
    });

    expect(capturedPasswordEncrypted).toBeNull();
  });

  it('omits passwordEncrypted from the update when password is not in input', async () => {
    let capturedUpdate: object = {};

    await updateStreamingAccountUseCase(input({ label: 'Updated' }), adminContext, {
      encryptor: testEncryptor,
      findStreamingAccountById: async () => existingAccount,
      updateStreamingAccount: async (_, update) => {
        capturedUpdate = update;
        return existingAccount;
      },
    });

    expect(capturedUpdate).not.toHaveProperty('passwordEncrypted');
  });

  it('updates label, email, maxProfiles and supportsProfiles', async () => {
    let capturedUpdate: object = {};

    await updateStreamingAccountUseCase(
      input({
        email: 'new@example.com',
        label: 'New label',
        maxProfiles: 5,
        supportsProfiles: true,
      }),
      adminContext,
      {
        encryptor: testEncryptor,
        findStreamingAccountById: async () => existingAccount,
        updateStreamingAccount: async (_, update) => {
          capturedUpdate = update;
          return existingAccount;
        },
      }
    );

    expect(capturedUpdate).toMatchObject({
      email: 'new@example.com',
      label: 'New label',
      maxProfiles: 5,
      supportsProfiles: true,
    });
  });

  it('throws when the repository returns null after update', async () => {
    await expect(
      updateStreamingAccountUseCase(input({ label: 'New' }), adminContext, {
        encryptor: testEncryptor,
        findStreamingAccountById: async () => existingAccount,
        updateStreamingAccount: async () => null,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNT_UPDATE_FAILED', statusCode: 500 });
  });
});
