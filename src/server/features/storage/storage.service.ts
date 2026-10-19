import { AppError } from '@/server/common/errors/app-error';
import { createLogger } from '@/server/config/logger.config';
import { env } from '@/server/config/env';
import { createLocalStorageProvider } from '@/server/features/storage/providers/local.provider';
import { createS3StorageProvider } from '@/server/features/storage/providers/s3.provider';
import type { StorageProvider } from '@/server/features/storage/storage.types';

const log = createLogger('storage');

export async function resolveImageUrl(key: string): Promise<string> {
  const provider = getActiveStorageProvider();
  return provider.resolvePublicUrl(key);
}

export async function uploadObject(input: {
  contentType: string;
  data: Buffer;
  key: string;
}): Promise<void> {
  const provider = getActiveStorageProvider();
  await provider.uploadObject(input);
}

export async function deleteObject(key: string): Promise<void> {
  const provider = getActiveStorageProvider();
  await provider.deleteObject(key);
}

// Storage is configured entirely from the environment (STORAGE_PROVIDER + the
// matching block in env.ts). Outside production an incomplete S3 block
// degrades to on-disk local storage, so development and tests work without any
// secrets. Production still fails loudly: silently writing uploads to a
// container's local disk looks like success and loses the files.
export function getActiveStorageProvider(
  dependencies: StorageServiceDependencies = defaultDependencies
): StorageProvider {
  if (dependencies.env.STORAGE_PROVIDER === 's3') {
    if (
      dependencies.env.S3_ACCESS_KEY_ID === undefined ||
      dependencies.env.S3_BUCKET === undefined ||
      dependencies.env.S3_PUBLIC_URL === undefined ||
      dependencies.env.S3_REGION === undefined ||
      dependencies.env.S3_SECRET_ACCESS_KEY === undefined
    ) {
      return fallbackOrFail('S3', dependencies);
    }

    return dependencies.createS3StorageProvider({
      accessKeyId: dependencies.env.S3_ACCESS_KEY_ID,
      bucket: dependencies.env.S3_BUCKET,
      endpoint: dependencies.env.S3_ENDPOINT ?? null,
      forcePathStyle: dependencies.env.S3_FORCE_PATH_STYLE,
      publicUrlBase: dependencies.env.S3_PUBLIC_URL,
      region: dependencies.env.S3_REGION,
      secretAccessKey: dependencies.env.S3_SECRET_ACCESS_KEY,
    });
  }

  return localProvider(dependencies);
}

function fallbackOrFail(
  providerName: string,
  dependencies: StorageServiceDependencies
): StorageProvider {
  if (dependencies.env.NODE_ENV === 'production') {
    throw new AppError(
      `Incomplete ${providerName} configuration`,
      500,
      'STORAGE_PROVIDER_INVALID_CONFIG'
    );
  }

  log.warn(
    { provider: providerName },
    `Incomplete ${providerName} configuration — falling back to local disk storage`
  );

  return localProvider(dependencies);
}

function localProvider(dependencies: StorageServiceDependencies): StorageProvider {
  return dependencies.createLocalStorageProvider({
    baseDir: './storage',
    publicBaseUrl: '/storage',
  });
}

const defaultDependencies: StorageServiceDependencies = {
  createLocalStorageProvider,
  createS3StorageProvider,
  env,
};

interface StorageServiceDependencies {
  createLocalStorageProvider: typeof createLocalStorageProvider;
  createS3StorageProvider: typeof createS3StorageProvider;
  env: typeof env;
}
