import {
  assignProfileToMembershipUseCase,
  type AssignProfileToMembershipDependencies,
} from '@/server/features/streaming-accounts/use-cases/assign-profile-to-membership.use-case';
import {
  adminContext,
  assignmentRecord,
  profileRecord,
  userContext,
} from '@/server/features/streaming-accounts/use-cases/assign-profile-to-membership.fixtures.test-support';

const input = {
  accountId: 'acc_test',
  membershipId: 'mbr_test',
  profileId: 'prf_test',
};

describe('assignProfileToMembershipUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findProfileByIdCalls = 0;
    let createAssignmentCalls = 0;

    await expect(
      assignProfileToMembershipUseCase(
        input,
        userContext,
        makeDependencies({
          createAssignmentAndMarkProfileAssigned: async () => {
            createAssignmentCalls += 1;
            return assignmentRecord;
          },
          findProfileById: async () => {
            findProfileByIdCalls += 1;
            return profileRecord;
          },
        })
      )
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });

    expect(findProfileByIdCalls).toBe(0);
    expect(createAssignmentCalls).toBe(0);
  });

  it('rejects when profile is not found', async () => {
    let createAssignmentCalls = 0;

    await expect(
      assignProfileToMembershipUseCase(
        input,
        adminContext,
        makeDependencies({
          createAssignmentAndMarkProfileAssigned: async () => {
            createAssignmentCalls += 1;
            return assignmentRecord;
          },
          findProfileById: async () => null,
        })
      )
    ).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
      statusCode: 404,
    });

    expect(createAssignmentCalls).toBe(0);
  });

  it('rejects when profile is already assigned by isAssigned flag', async () => {
    let findStreamingAccountByIdCalls = 0;
    let createAssignmentCalls = 0;

    await expect(
      assignProfileToMembershipUseCase(
        input,
        adminContext,
        makeDependencies({
          createAssignmentAndMarkProfileAssigned: async () => {
            createAssignmentCalls += 1;
            return assignmentRecord;
          },
          findProfileById: async () => ({ ...profileRecord, isAssigned: true }),
          findStreamingAccountById: async () => {
            findStreamingAccountByIdCalls += 1;
            return { isActive: true };
          },
        })
      )
    ).rejects.toMatchObject({
      code: 'PROFILE_ALREADY_ASSIGNED',
      statusCode: 409,
    });

    expect(findStreamingAccountByIdCalls).toBe(0);
    expect(createAssignmentCalls).toBe(0);
  });

  it('rejects when profile does not belong to the provided account', async () => {
    let createAssignmentCalls = 0;

    await expect(
      assignProfileToMembershipUseCase(
        input,
        adminContext,
        makeDependencies({
          createAssignmentAndMarkProfileAssigned: async () => {
            createAssignmentCalls += 1;
            return assignmentRecord;
          },
          findProfileById: async () => ({
            ...profileRecord,
            accountId: 'acc_other',
          }),
        })
      )
    ).rejects.toMatchObject({
      code: 'PROFILE_ACCOUNT_MISMATCH',
      statusCode: 409,
    });

    expect(createAssignmentCalls).toBe(0);
  });

  it('rejects when account is not found', async () => {
    let findMembershipByIdCalls = 0;
    let createAssignmentCalls = 0;

    await expect(
      assignProfileToMembershipUseCase(
        input,
        adminContext,
        makeDependencies({
          createAssignmentAndMarkProfileAssigned: async () => {
            createAssignmentCalls += 1;
            return assignmentRecord;
          },
          findMembershipById: async () => {
            findMembershipByIdCalls += 1;
            return {};
          },
          findStreamingAccountById: async () => null,
        })
      )
    ).rejects.toMatchObject({
      code: 'ACCOUNT_NOT_FOUND',
      statusCode: 404,
    });

    expect(findMembershipByIdCalls).toBe(0);
    expect(createAssignmentCalls).toBe(0);
  });

  it('rejects when account is inactive', async () => {
    let findMembershipByIdCalls = 0;
    let createAssignmentCalls = 0;

    await expect(
      assignProfileToMembershipUseCase(
        input,
        adminContext,
        makeDependencies({
          createAssignmentAndMarkProfileAssigned: async () => {
            createAssignmentCalls += 1;
            return assignmentRecord;
          },
          findMembershipById: async () => {
            findMembershipByIdCalls += 1;
            return {};
          },
          findStreamingAccountById: async () => ({ isActive: false }),
        })
      )
    ).rejects.toMatchObject({
      code: 'ACCOUNT_INACTIVE',
      statusCode: 409,
    });

    expect(findMembershipByIdCalls).toBe(0);
    expect(createAssignmentCalls).toBe(0);
  });

  it('rejects when membership is not found', async () => {
    let findActiveAssignmentByProfileIdCalls = 0;
    let createAssignmentCalls = 0;

    await expect(
      assignProfileToMembershipUseCase(
        input,
        adminContext,
        makeDependencies({
          createAssignmentAndMarkProfileAssigned: async () => {
            createAssignmentCalls += 1;
            return assignmentRecord;
          },
          findActiveAssignmentByProfileId: async () => {
            findActiveAssignmentByProfileIdCalls += 1;
            return null;
          },
          findMembershipById: async () => null,
        })
      )
    ).rejects.toMatchObject({
      code: 'MEMBERSHIP_NOT_FOUND',
      statusCode: 404,
    });

    expect(findActiveAssignmentByProfileIdCalls).toBe(0);
    expect(createAssignmentCalls).toBe(0);
  });

  it('rejects when profile already has active assignment from DB check', async () => {
    let createAssignmentCalls = 0;

    await expect(
      assignProfileToMembershipUseCase(
        input,
        adminContext,
        makeDependencies({
          createAssignmentAndMarkProfileAssigned: async () => {
            createAssignmentCalls += 1;
            return assignmentRecord;
          },
          findActiveAssignmentByProfileId: async () => assignmentRecord,
        })
      )
    ).rejects.toMatchObject({
      code: 'PROFILE_ALREADY_ASSIGNED',
      statusCode: 409,
    });

    expect(createAssignmentCalls).toBe(0);
  });

  it('creates assignment and marks profile assigned in one repository operation', async () => {
    let capturedMembershipId = '';
    let capturedProfileId = '';

    const result = await assignProfileToMembershipUseCase(
      input,
      adminContext,
      makeDependencies({
        createAssignmentAndMarkProfileAssigned: async (assignmentInput) => {
          capturedMembershipId = assignmentInput.membershipId;
          capturedProfileId = assignmentInput.profileId ?? '';
          return { ...assignmentRecord, ...assignmentInput };
        },
      })
    );

    expect(result.membershipId).toBe('mbr_test');
    expect(result.profileId).toBe('prf_test');
    expect(capturedMembershipId).toBe('mbr_test');
    expect(capturedProfileId).toBe('prf_test');
  });

  it('rejects when the transactional assignment loses the profile assignment race', async () => {
    await expect(
      assignProfileToMembershipUseCase(
        input,
        adminContext,
        makeDependencies({
          createAssignmentAndMarkProfileAssigned: async () => null,
        })
      )
    ).rejects.toMatchObject({
      code: 'PROFILE_ALREADY_ASSIGNED',
      statusCode: 409,
    });
  });
});

function makeDependencies(
  overrides: Partial<AssignProfileToMembershipDependencies> = {}
): AssignProfileToMembershipDependencies {
  return {
    createAssignmentAndMarkProfileAssigned: async (assignmentInput) => ({
      ...assignmentRecord,
      ...assignmentInput,
    }),
    createId: () => 'asg_test',
    findActiveAssignmentByProfileId: async () => null,
    findMembershipById: async () => ({}),
    findProfileById: async () => profileRecord,
    findStreamingAccountById: async () => ({ isActive: true }),
    ...overrides,
  };
}
