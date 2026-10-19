import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  deleteAssignment,
  findAssignmentById,
  findProfileById,
  updateProfileAssigned,
} from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { UnassignProfileInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import type { StreamingProfileRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export async function unassignProfileUseCase(
  input: UnassignProfileInput,
  context: GqlContext,
  dependencies: UnassignProfileDependencies = defaultDependencies
) {
  requireAdmin(context);

  const assignment = await dependencies.findAssignmentById(input.assignmentId);

  if (assignment === null) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  if (assignment.profileId === null) {
    throw new AppError('Assignment has no profile to unassign', 409, 'ASSIGNMENT_PROFILE_REQUIRED');
  }

  await dependencies.deleteAssignment(input.assignmentId);

  const profile = await dependencies.updateProfileAssigned(assignment.profileId, false);

  if (profile === null) {
    throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  return profile;
}

interface UnassignProfileDependencies {
  findAssignmentById: (id: string) => Promise<{ profileId: string | null } | null>;
  findProfileById: (id: string) => Promise<StreamingProfileRecord | null>;
  deleteAssignment: (id: string) => Promise<void>;
  updateProfileAssigned: (
    id: string,
    isAssigned: boolean
  ) => Promise<StreamingProfileRecord | null>;
}

const defaultDependencies: UnassignProfileDependencies = {
  findAssignmentById,
  findProfileById,
  deleteAssignment,
  updateProfileAssigned,
};
