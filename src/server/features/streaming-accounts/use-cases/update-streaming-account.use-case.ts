import { AppError } from '@/server/common/errors/app-error';
import { Encryptor } from '@/server/common/security/encryptor';
import type { IEncryptor } from '@/server/common/security/encryptor';
import { env } from '@/server/config/env';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findStreamingAccountById,
  updateStreamingAccount,
} from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { UpdateStreamingAccountInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import type { StreamingAccountRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export async function updateStreamingAccountUseCase(
  input: UpdateStreamingAccountInput,
  context: GqlContext,
  dependencies: Dependencies = defaultDependencies
) {
  requireAdmin(context);

  const account = await dependencies.findStreamingAccountById(input.id);

  if (account === null || !account.isActive) {
    throw new AppError('Streaming account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  const passwordEncrypted = encryptOptionalSecret(input.password, dependencies.encryptor);

  const updated = await dependencies.updateStreamingAccount(input.id, {
    ...(input.email !== undefined && { email: input.email }),
    ...(input.label != null && { label: input.label }),
    ...(input.maxProfiles != null && { maxProfiles: input.maxProfiles }),
    ...(passwordEncrypted !== undefined && { passwordEncrypted }),
    ...(input.supportsProfiles != null && { supportsProfiles: input.supportsProfiles }),
  });

  if (updated === null) {
    throw new AppError('Failed to update streaming account', 500, 'ACCOUNT_UPDATE_FAILED');
  }

  return updated;
}

interface Dependencies {
  encryptor: Pick<IEncryptor, 'encrypt'>;
  findStreamingAccountById: (id: string) => Promise<StreamingAccountRecord | null>;
  updateStreamingAccount: (
    id: string,
    input: Partial<{
      email: string | null;
      label: string;
      maxProfiles: number;
      passwordEncrypted: string | null;
      supportsProfiles: boolean;
    }>
  ) => Promise<StreamingAccountRecord | null>;
}

const defaultDependencies: Dependencies = {
  encryptor: new Encryptor(env.ENCRYPTION_KEY),
  findStreamingAccountById,
  updateStreamingAccount,
};

/**
 * Three distinct intents, not two: `undefined` leaves the stored secret
 * alone, an empty string clears it, and a value replaces it.
 */
function encryptOptionalSecret(
  secret: string | null | undefined,
  encryptor: { encrypt: (value: string) => string }
): string | null | undefined {
  if (secret === undefined) return undefined;
  // Both null and '' mean "clear it" — matching the original expression,
  // which fell through to null for any falsy value.
  if (secret === null || secret === '') return null;

  return encryptor.encrypt(secret);
}
