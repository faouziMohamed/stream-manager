import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { StreamingProfileRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';
import { deleteStreamingProfileUseCase } from '@/server/features/streaming-accounts/use-cases/delete-streaming-profile.use-case';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: { avatar: null, email: 'admin@example.com', id: 'usr_admin', name: 'Admin', role: 'admin' },
};

const anonContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

const userContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: 'ses_user',
  user: { avatar: null, email: 'user@example.com', id: 'usr_user', name: 'User', role: 'user' },
};

const freeProfile: StreamingProfileRecord = {
  accountId: 'acc_1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  id: 'prof_1',
  isAssigned: false,
  name: 'Profile 1',
  pinEncrypted: null,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const assignedProfile: StreamingProfileRecord = { ...freeProfile, id: 'prof_2', isAssigned: true };

describe('deleteStreamingProfileUseCase', () => {
  it('deletes an unassigned profile for admin', async () => {
    const result = await deleteStreamingProfileUseCase({ id: 'prof_1' }, adminContext, {
      deleteStreamingProfile: async () => freeProfile,
      findProfileById: async () => freeProfile,
    });

    expect(result.id).toBe('prof_1');
  });

  it('throws PROFILE_NOT_FOUND when profile does not exist', async () => {
    await expect(
      deleteStreamingProfileUseCase({ id: 'prof_missing' }, adminContext, {
        deleteStreamingProfile: async () => null,
        findProfileById: async () => null,
      })
    ).rejects.toMatchObject({ code: 'PROFILE_NOT_FOUND' });
  });

  it('throws PROFILE_IS_ASSIGNED when profile is currently assigned', async () => {
    await expect(
      deleteStreamingProfileUseCase({ id: 'prof_2' }, adminContext, {
        deleteStreamingProfile: async () => null,
        findProfileById: async () => assignedProfile,
      })
    ).rejects.toMatchObject({ code: 'PROFILE_IS_ASSIGNED' });
  });

  it('throws PROFILE_DELETE_FAILED when deletion returns null', async () => {
    await expect(
      deleteStreamingProfileUseCase({ id: 'prof_1' }, adminContext, {
        deleteStreamingProfile: async () => null,
        findProfileById: async () => freeProfile,
      })
    ).rejects.toMatchObject({ code: 'PROFILE_DELETE_FAILED' });
  });

  it('rejects non-admin users with FORBIDDEN', async () => {
    await expect(
      deleteStreamingProfileUseCase({ id: 'prof_1' }, userContext, {
        deleteStreamingProfile: async () => freeProfile,
        findProfileById: async () => freeProfile,
      })
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('rejects unauthenticated users with UNAUTHENTICATED', async () => {
    await expect(
      deleteStreamingProfileUseCase({ id: 'prof_1' }, anonContext, {
        deleteStreamingProfile: async () => freeProfile,
        findProfileById: async () => freeProfile,
      })
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});
