import { AppError } from '@/server/common/errors/app-error';
import { createResourceId } from '@/server/common/utils/resource-id';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findProfileById,
  findStreamingAccountById,
  createAssignmentAndMarkProfileAssigned,
  findActiveAssignmentByProfileId,
  insertAssignment,
} from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import { findMembershipById } from '@/server/features/memberships/repositories/memberships.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { AssignProfileToMembershipInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import type {
  StreamingProfileAssignmentRecord,
  StreamingProfileRecord,
} from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export interface AssignProfileToMembershipDependencies {
  createId: () => string;
  findProfileById: (id: string) => Promise<StreamingProfileRecord | null>;
  findStreamingAccountById: (id: string) => Promise<{ isActive: boolean } | null>;
  findMembershipById: (id: string) => Promise<unknown | null>;
  findActiveAssignmentByProfileId: (
    profileId: string
  ) => Promise<StreamingProfileAssignmentRecord | null>;
  createAssignmentAndMarkProfileAssigned: (
    input: InsertAssignmentInput
  ) => Promise<StreamingProfileAssignmentRecord | null>;
}

export async function assignProfileToMembershipUseCase(
  input: AssignProfileToMembershipInput,
  context: GqlContext,
  dependencies: AssignProfileToMembershipDependencies = defaultDependencies
) {
  requireAdmin(context);

  const profile = await dependencies.findProfileById(input.profileId);

  if (profile === null) {
    throw new AppError('Streaming profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  if (profile.isAssigned) {
    throw new AppError(
      'This profile is already assigned to a membership',
      409,
      'PROFILE_ALREADY_ASSIGNED'
    );
  }

  if (profile.accountId !== input.accountId) {
    throw new AppError(
      'This profile does not belong to the provided streaming account',
      409,
      'PROFILE_ACCOUNT_MISMATCH'
    );
  }

  const account = await dependencies.findStreamingAccountById(input.accountId);

  if (account === null) {
    throw new AppError('Streaming account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  if (!account.isActive) {
    throw new AppError('Streaming account is inactive', 409, 'ACCOUNT_INACTIVE');
  }

  const membership = await dependencies.findMembershipById(input.membershipId);

  if (membership === null) {
    throw new AppError('Membership not found', 404, 'MEMBERSHIP_NOT_FOUND');
  }

  const existingAssignment = await dependencies.findActiveAssignmentByProfileId(input.profileId);

  if (existingAssignment !== null) {
    throw new AppError('This profile is already assigned', 409, 'PROFILE_ALREADY_ASSIGNED');
  }

  const assignment = await dependencies.createAssignmentAndMarkProfileAssigned({
    accountId: input.accountId,
    id: dependencies.createId(),
    membershipId: input.membershipId,
    profileId: input.profileId,
  });

  if (assignment === null) {
    throw new AppError('This profile is already assigned', 409, 'PROFILE_ALREADY_ASSIGNED');
  }

  return assignment;
}

type InsertAssignmentInput = typeof insertAssignment extends (input: infer I) => unknown
  ? I
  : never;

const defaultDependencies: AssignProfileToMembershipDependencies = {
  createId: () => createResourceId('asg'),
  findProfileById,
  findStreamingAccountById,
  findMembershipById,
  findActiveAssignmentByProfileId,
  createAssignmentAndMarkProfileAssigned,
};
