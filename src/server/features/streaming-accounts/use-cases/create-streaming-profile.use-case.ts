import { AppError } from '@/server/common/errors/app-error';
import { Encryptor } from '@/server/common/security/encryptor';
import type { IEncryptor } from '@/server/common/security/encryptor';
import { env } from '@/server/config/env';
import { createResourceId } from '@/server/common/utils/resource-id';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findProfilesByAccountId,
  findStreamingAccountById,
  insertStreamingProfile,
} from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { CreateStreamingProfileInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import type { StreamingProfileRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export async function createStreamingProfileUseCase(
  input: CreateStreamingProfileInput,
  context: GqlContext,
  dependencies: CreateStreamingProfileDependencies = defaultDependencies
) {
  requireAdmin(context);

  const account = await dependencies.findStreamingAccountById(input.accountId);

  if (account === null) {
    throw new AppError('Streaming account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  if (!account.isActive) {
    throw new AppError('Streaming account is inactive', 409, 'ACCOUNT_INACTIVE');
  }

  if (!account.supportsProfiles) {
    throw new AppError('This account does not support profiles', 409, 'ACCOUNT_NO_PROFILES');
  }

  // Capacity is the account's allowance, not a number to discover after the
  // fact: without this a 3-of-5 account could be given a fourth profile, and
  // the stats would then read capacity as "however many exist".
  const existing = await dependencies.findProfilesByAccountId(input.accountId);

  if (existing.length >= account.maxProfiles) {
    throw new AppError(
      `This account already has all ${account.maxProfiles} profile slots`,
      409,
      'ACCOUNT_PROFILE_LIMIT'
    );
  }

  const pinEncrypted = input.pin ? dependencies.encryptor.encrypt(input.pin) : null;

  const profile = await dependencies.insertStreamingProfile({
    accountId: input.accountId,
    id: dependencies.createId(),
    isAssigned: false,
    name: input.name,
    pinEncrypted,
  });

  if (profile === null) {
    throw new AppError('Streaming profile could not be created', 500, 'PROFILE_CREATE_FAILED');
  }

  return profile;
}

type InsertStreamingProfileInput = typeof insertStreamingProfile extends (input: infer I) => unknown
  ? I
  : never;

interface CreateStreamingProfileDependencies {
  createId: () => string;
  findProfilesByAccountId: (accountId: string) => Promise<{ id: string }[]>;
  encryptor: Pick<IEncryptor, 'encrypt'>;
  findStreamingAccountById: (
    id: string
  ) => Promise<{ isActive: boolean; maxProfiles: number; supportsProfiles: boolean } | null>;
  insertStreamingProfile: (
    input: InsertStreamingProfileInput
  ) => Promise<StreamingProfileRecord | null>;
}

const defaultDependencies: CreateStreamingProfileDependencies = {
  createId: () => createResourceId('prf'),
  encryptor: new Encryptor(env.ENCRYPTION_KEY),
  findProfilesByAccountId,
  findStreamingAccountById,
  insertStreamingProfile,
};
