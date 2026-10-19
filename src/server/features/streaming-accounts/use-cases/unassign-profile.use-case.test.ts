import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { unassignProfileUseCase } from '@/server/features/streaming-accounts/use-cases/unassign-profile.use-case';

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
  isAssigned: true,
  name: 'Profile 1',
  pinEncrypted: null,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('unassignProfileUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findAssignmentByIdCalls = 0;
    let deleteAssignmentCalls = 0;

    await expect(
      unassignProfileUseCase({ assignmentId: 'asg_test' }, userContext, {
        findAssignmentById: async () => {
          findAssignmentByIdCalls += 1;
          return { profileId: 'prf_test' };
        },
        findProfileById: async () => profileRecord,
        deleteAssignment: async () => {
          deleteAssignmentCalls += 1;
        },
        updateProfileAssigned: async () => ({
          ...profileRecord,
          isAssigned: false,
        }),
      })
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });

    expect(findAssignmentByIdCalls).toBe(0);
    expect(deleteAssignmentCalls).toBe(0);
  });

  it('rejects when assignment is not found', async () => {
    let deleteAssignmentCalls = 0;

    await expect(
      unassignProfileUseCase({ assignmentId: 'asg_missing' }, adminContext, {
        findAssignmentById: async () => null,
        findProfileById: async () => profileRecord,
        deleteAssignment: async () => {
          deleteAssignmentCalls += 1;
        },
        updateProfileAssigned: async () => ({
          ...profileRecord,
          isAssigned: false,
        }),
      })
    ).rejects.toMatchObject({
      code: 'ASSIGNMENT_NOT_FOUND',
      statusCode: 404,
    });

    expect(deleteAssignmentCalls).toBe(0);
  });

  it('unassigns when assignment has profileId', async () => {
    let deletedAssignmentId = '';
    let updatedProfileId = '';
    let updatedIsAssigned: boolean | null = null;

    const result = await unassignProfileUseCase({ assignmentId: 'asg_test' }, adminContext, {
      findAssignmentById: async () => ({ profileId: 'prf_test' }),
      findProfileById: async () => profileRecord,
      deleteAssignment: async (id) => {
        deletedAssignmentId = id;
      },
      updateProfileAssigned: async (id, isAssigned) => {
        updatedProfileId = id;
        updatedIsAssigned = isAssigned;
        return { ...profileRecord, isAssigned };
      },
    });

    expect(deletedAssignmentId).toBe('asg_test');
    expect(updatedProfileId).toBe('prf_test');
    expect(updatedIsAssigned).toBe(false);
    expect(result.isAssigned).toBe(false);
  });

  it('rejects when assignment has null profileId', async () => {
    let deleteAssignmentCalled = false;
    let updateProfileAssignedCalled = false;

    await expect(
      unassignProfileUseCase({ assignmentId: 'asg_test' }, adminContext, {
        findAssignmentById: async () => ({ profileId: null }),
        findProfileById: async () => profileRecord,
        deleteAssignment: async () => {
          deleteAssignmentCalled = true;
        },
        updateProfileAssigned: async () => {
          updateProfileAssignedCalled = true;
          return { ...profileRecord, isAssigned: false };
        },
      })
    ).rejects.toMatchObject({
      code: 'ASSIGNMENT_PROFILE_REQUIRED',
      statusCode: 409,
    });

    expect(deleteAssignmentCalled).toBe(false);
    expect(updateProfileAssignedCalled).toBe(false);
  });

  it('throws PROFILE_NOT_FOUND when updateProfileAssigned returns null', async () => {
    await expect(
      unassignProfileUseCase({ assignmentId: 'asg_test' }, adminContext, {
        findAssignmentById: async () => ({ profileId: 'prf_test' }),
        findProfileById: async () => profileRecord,
        deleteAssignment: async () => {
          return;
        },
        updateProfileAssigned: async () => null,
      })
    ).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
      statusCode: 404,
    });
  });
});
