import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findProfileById,
  deleteStreamingProfile,
} from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { DeleteStreamingProfileInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import type { StreamingProfileRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export async function deleteStreamingProfileUseCase(
  input: DeleteStreamingProfileInput,
  context: GqlContext,
  dependencies: Dependencies = defaultDependencies
) {
  requireAdmin(context);

  const profile = await dependencies.findProfileById(input.id);

  if (profile === null) {
    throw new AppError('Streaming profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  if (profile.isAssigned) {
    throw new AppError(
      'Cannot delete an assigned profile. Unassign it from its membership first.',
      409,
      'PROFILE_IS_ASSIGNED'
    );
  }

  const deleted = await dependencies.deleteStreamingProfile(input.id);

  if (deleted === null) {
    throw new AppError('Failed to delete streaming profile', 500, 'PROFILE_DELETE_FAILED');
  }

  return deleted;
}

interface Dependencies {
  findProfileById: (id: string) => Promise<StreamingProfileRecord | null>;
  deleteStreamingProfile: (id: string) => Promise<StreamingProfileRecord | null>;
}

const defaultDependencies: Dependencies = {
  findProfileById,
  deleteStreamingProfile,
};
