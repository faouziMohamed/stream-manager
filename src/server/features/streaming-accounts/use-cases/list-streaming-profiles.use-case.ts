import { AppError } from '@/server/common/errors/app-error';
import { requireModerator } from '@/server/features/common/guards/require-moderator.guard';
import {
  findProfilesByAccountId,
  findStreamingAccountById,
} from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { StreamingProfileRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export async function listStreamingProfilesUseCase(
  accountId: string,
  context: GqlContext,
  dependencies: ListStreamingProfilesDependencies = defaultDependencies
) {
  requireModerator(context);

  const account = await dependencies.findStreamingAccountById(accountId);

  if (account === null) {
    throw new AppError('Streaming account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  return dependencies.findProfilesByAccountId(accountId);
}

interface ListStreamingProfilesDependencies {
  findStreamingAccountById: (id: string) => Promise<unknown | null>;
  findProfilesByAccountId: (accountId: string) => Promise<StreamingProfileRecord[]>;
}

const defaultDependencies: ListStreamingProfilesDependencies = {
  findStreamingAccountById,
  findProfilesByAccountId,
};
