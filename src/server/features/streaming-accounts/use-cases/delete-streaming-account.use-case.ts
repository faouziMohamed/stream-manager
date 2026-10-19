import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findStreamingAccountById,
  softDeleteStreamingAccount,
  findProfilesByAccountId,
} from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { DeleteStreamingAccountInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import type { StreamingAccountRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export async function deleteStreamingAccountUseCase(
  input: DeleteStreamingAccountInput,
  context: GqlContext,
  dependencies: Dependencies = defaultDependencies
) {
  requireAdmin(context);

  const account = await dependencies.findStreamingAccountById(input.id);

  if (account === null || !account.isActive) {
    throw new AppError('Streaming account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  const profiles = await dependencies.findProfilesByAccountId(input.id);
  const hasActiveAssignments = profiles.some((profile) => profile.isAssigned);

  if (hasActiveAssignments) {
    throw new AppError(
      'Cannot archive a streaming account with active profile assignments. Unassign all profiles first.',
      409,
      'ACCOUNT_HAS_ACTIVE_ASSIGNMENTS'
    );
  }

  const deleted = await dependencies.softDeleteStreamingAccount(input.id);

  if (deleted === null) {
    throw new AppError('Failed to archive streaming account', 500, 'ACCOUNT_DELETE_FAILED');
  }

  return deleted;
}

interface Dependencies {
  findStreamingAccountById: (id: string) => Promise<StreamingAccountRecord | null>;
  findProfilesByAccountId: (accountId: string) => Promise<{ isAssigned: boolean }[]>;
  softDeleteStreamingAccount: (id: string) => Promise<StreamingAccountRecord | null>;
}

const defaultDependencies: Dependencies = {
  findStreamingAccountById,
  findProfilesByAccountId,
  softDeleteStreamingAccount,
};
