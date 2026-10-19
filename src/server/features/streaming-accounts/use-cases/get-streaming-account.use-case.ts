import { AppError } from '@/server/common/errors/app-error';
import { requireModerator } from '@/server/features/common/guards/require-moderator.guard';
import {
  findStreamingAccountById,
  findProfilesByAccountId,
} from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type {
  StreamingAccountRecord,
  StreamingProfileRecord,
} from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export async function getStreamingAccountUseCase(
  id: string,
  context: GqlContext,
  dependencies: GetStreamingAccountDependencies = defaultDependencies
) {
  requireModerator(context);

  const account = await dependencies.findStreamingAccountById(id);

  if (account === null) {
    throw new AppError('Streaming account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  const profiles = await dependencies.findProfilesByAccountId(id);

  return {
    ...account,
    profiles,
  };
}

interface GetStreamingAccountDependencies {
  findStreamingAccountById: (id: string) => Promise<StreamingAccountRecord | null>;
  findProfilesByAccountId: (accountId: string) => Promise<StreamingProfileRecord[]>;
}

const defaultDependencies: GetStreamingAccountDependencies = {
  findStreamingAccountById,
  findProfilesByAccountId,
};
