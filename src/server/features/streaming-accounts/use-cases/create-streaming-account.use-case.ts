import { AppError } from '@/server/common/errors/app-error';
import { Encryptor } from '@/server/common/security/encryptor';
import type { IEncryptor } from '@/server/common/security/encryptor';
import { env } from '@/server/config/env';
import { resourceIdPrefixes } from '@/server/common/constants/id-prefixes';
import { createResourceId } from '@/server/common/utils/resource-id';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { insertStreamingAccount } from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import { findServiceById } from '@/server/features/services/repositories/services.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { CreateStreamingAccountInput } from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import type { StreamingAccountRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export async function createStreamingAccountUseCase(
  input: CreateStreamingAccountInput,
  context: GqlContext,
  dependencies: CreateStreamingAccountDependencies = defaultDependencies
) {
  requireAdmin(context);

  const service = await dependencies.findServiceById(input.serviceId);

  if (service === null) {
    throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
  }

  if (!service.isActive) {
    throw new AppError('Service is inactive', 409, 'SERVICE_INACTIVE');
  }

  const passwordEncrypted = input.password ? dependencies.encryptor.encrypt(input.password) : null;

  const account = await dependencies.insertStreamingAccount({
    email: input.email ?? null,
    id: dependencies.createId(),
    isActive: true,
    label: input.label,
    maxProfiles: input.maxProfiles ?? 1,
    passwordEncrypted,
    serviceId: input.serviceId,
    supportsProfiles: input.supportsProfiles ?? false,
  });

  if (account === null) {
    throw new AppError('Streaming account could not be created', 500, 'ACCOUNT_CREATE_FAILED');
  }

  return account;
}

type InsertStreamingAccountInput = typeof insertStreamingAccount extends (input: infer I) => unknown
  ? I
  : never;

interface CreateStreamingAccountDependencies {
  createId: () => string;
  encryptor: Pick<IEncryptor, 'encrypt'>;
  findServiceById: (id: string) => Promise<{ isActive: boolean } | null>;
  insertStreamingAccount: (
    input: InsertStreamingAccountInput
  ) => Promise<StreamingAccountRecord | null>;
}

const defaultDependencies: CreateStreamingAccountDependencies = {
  createId: () => createResourceId(resourceIdPrefixes.account),
  encryptor: new Encryptor(env.ENCRYPTION_KEY),
  findServiceById,
  insertStreamingAccount,
};
