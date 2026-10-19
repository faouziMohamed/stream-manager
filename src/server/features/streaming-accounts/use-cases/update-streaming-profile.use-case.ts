import { AppError } from '@/server/common/errors/app-error';
import { Encryptor } from '@/server/common/security/encryptor';
import type { IEncryptor } from '@/server/common/security/encryptor';
import { env } from '@/server/config/env';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findProfileById,
  updateStreamingProfile,
} from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { UpdateStreamingProfileInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import type { StreamingProfileRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export async function updateStreamingProfileUseCase(
  input: UpdateStreamingProfileInput,
  context: GqlContext,
  dependencies: Dependencies = defaultDependencies
) {
  requireAdmin(context);

  const profile = await dependencies.findProfileById(input.id);

  if (profile === null) {
    throw new AppError('Streaming profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  const pinEncrypted = encryptOptionalSecret(input.pin, dependencies.encryptor);

  const updated = await dependencies.updateStreamingProfile(input.id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(pinEncrypted !== undefined && { pinEncrypted }),
  });

  if (updated === null) {
    throw new AppError('Failed to update streaming profile', 500, 'PROFILE_UPDATE_FAILED');
  }

  return updated;
}

interface Dependencies {
  encryptor: Pick<IEncryptor, 'encrypt'>;
  findProfileById: (id: string) => Promise<StreamingProfileRecord | null>;
  updateStreamingProfile: (
    id: string,
    input: Partial<{ name: string; pinEncrypted: string | null }>
  ) => Promise<StreamingProfileRecord | null>;
}

const defaultDependencies: Dependencies = {
  encryptor: new Encryptor(env.ENCRYPTION_KEY),
  findProfileById,
  updateStreamingProfile,
};

/**
 * Three distinct intents, not two: `undefined` leaves the stored PIN alone,
 * an empty string clears it, and a value replaces it.
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
