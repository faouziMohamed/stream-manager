import type { Encryptor } from '@/server/common/security/encryptor';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { UpdateStreamingProfileInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import type { StreamingProfileRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';
import { updateStreamingProfileUseCase } from '@/server/features/streaming-accounts/use-cases/update-streaming-profile.use-case';

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

const existingProfile: StreamingProfileRecord = {
  accountId: 'acc_test',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  id: 'prf_test',
  isAssigned: false,
  name: 'Old profile',
  pinEncrypted: 'enc_old',
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const testEncryptor = {
  encrypt: (value: string) => `enc_${value}`,
} as unknown as Encryptor;

function input(overrides: Partial<UpdateStreamingProfileInput> = {}): UpdateStreamingProfileInput {
  return { id: 'prf_test', ...overrides };
}

describe('updateStreamingProfileUseCase', () => {
  it('rejects non-admin users without reaching the repository', async () => {
    let findCalls = 0;

    await expect(
      updateStreamingProfileUseCase(input({ name: 'New name' }), userContext, {
        encryptor: testEncryptor,
        findProfileById: async () => {
          findCalls += 1;
          return existingProfile;
        },
        updateStreamingProfile: async () => existingProfile,
      })
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });

    expect(findCalls).toBe(0);
  });

  it('rejects when profile is not found', async () => {
    await expect(
      updateStreamingProfileUseCase(input(), adminContext, {
        encryptor: testEncryptor,
        findProfileById: async () => null,
        updateStreamingProfile: async () => null,
      })
    ).rejects.toMatchObject({ code: 'PROFILE_NOT_FOUND', statusCode: 404 });
  });

  it('encrypts a new PIN when provided', async () => {
    let capturedPinEncrypted: unknown = 'unset';

    await updateStreamingProfileUseCase(input({ pin: '1234' }), adminContext, {
      encryptor: testEncryptor,
      findProfileById: async () => existingProfile,
      updateStreamingProfile: async (_, update) => {
        capturedPinEncrypted = update.pinEncrypted;
        return existingProfile;
      },
    });

    expect(capturedPinEncrypted).toBe('enc_1234');
  });

  it('clears the PIN when an empty string is passed', async () => {
    let capturedPinEncrypted: unknown = 'unset';

    await updateStreamingProfileUseCase(input({ pin: '' }), adminContext, {
      encryptor: testEncryptor,
      findProfileById: async () => existingProfile,
      updateStreamingProfile: async (_, update) => {
        capturedPinEncrypted = update.pinEncrypted;
        return existingProfile;
      },
    });

    expect(capturedPinEncrypted).toBeNull();
  });

  it('omits pinEncrypted from the update when pin is not in input', async () => {
    let capturedUpdate: object = {};

    await updateStreamingProfileUseCase(input({ name: 'New name' }), adminContext, {
      encryptor: testEncryptor,
      findProfileById: async () => existingProfile,
      updateStreamingProfile: async (_, update) => {
        capturedUpdate = update;
        return existingProfile;
      },
    });

    expect(capturedUpdate).not.toHaveProperty('pinEncrypted');
    expect(capturedUpdate).toMatchObject({ name: 'New name' });
  });

  it('updates the profile name', async () => {
    const updated = await updateStreamingProfileUseCase(input({ name: 'Renamed' }), adminContext, {
      encryptor: testEncryptor,
      findProfileById: async () => existingProfile,
      updateStreamingProfile: async (_, update) => ({ ...existingProfile, ...update }),
    });

    expect(updated.name).toBe('Renamed');
  });

  it('throws when the repository returns null after update', async () => {
    await expect(
      updateStreamingProfileUseCase(input({ name: 'New' }), adminContext, {
        encryptor: testEncryptor,
        findProfileById: async () => existingProfile,
        updateStreamingProfile: async () => null,
      })
    ).rejects.toMatchObject({ code: 'PROFILE_UPDATE_FAILED', statusCode: 500 });
  });
});
