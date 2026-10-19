import { getActiveStorageProvider } from '@/server/features/storage/storage.service';
import type { StorageProvider } from '@/server/features/storage/storage.types';

const stub = { kind: '' } as unknown as StorageProvider;

function dependencies(overrides: Record<string, unknown>) {
  const calls: string[] = [];

  const base = {
    createLocalStorageProvider: () => {
      calls.push('local');
      return stub;
    },
    createS3StorageProvider: () => {
      calls.push('s3');
      return stub;
    },
    env: {
      NODE_ENV: 'development',
      S3_ACCESS_KEY_ID: undefined,
      S3_BUCKET: undefined,
      S3_ENDPOINT: undefined,
      S3_FORCE_PATH_STYLE: false,
      S3_PUBLIC_URL: undefined,
      S3_REGION: undefined,
      S3_SECRET_ACCESS_KEY: undefined,
      STORAGE_PROVIDER: 's3',
      ...(overrides.env as Record<string, unknown>),
    },
    ...overrides,
  };

  return { base: base as never, calls };
}

const COMPLETE_S3 = {
  S3_ACCESS_KEY_ID: 'key',
  S3_BUCKET: 'bucket',
  S3_PUBLIC_URL: 'https://cdn.example.com',
  S3_REGION: 'eu-west-1',
  S3_SECRET_ACCESS_KEY: 'secret',
};

describe('getActiveStorageProvider', () => {
  it('uses S3 when the block is complete', () => {
    const { base, calls } = dependencies({ env: { ...COMPLETE_S3, STORAGE_PROVIDER: 's3' } });

    getActiveStorageProvider(base);

    expect(calls).toEqual(['s3']);
  });

  it('selects local storage when asked for it', () => {
    const { base, calls } = dependencies({ env: { STORAGE_PROVIDER: 'local' } });

    getActiveStorageProvider(base);

    expect(calls).toEqual(['local']);
  });

  it('degrades to local outside production when the S3 block is incomplete', () => {
    const { base, calls } = dependencies({
      env: { NODE_ENV: 'development', STORAGE_PROVIDER: 's3' },
    });

    getActiveStorageProvider(base);

    expect(calls).toEqual(['local']);
  });

  it('fails loudly in production rather than writing uploads to a container disk', () => {
    const { base } = dependencies({ env: { NODE_ENV: 'production', STORAGE_PROVIDER: 's3' } });

    expect(() => getActiveStorageProvider(base)).toThrow(/Incomplete S3 configuration/);
  });

  it('never falls back when production config is complete', () => {
    const { base, calls } = dependencies({
      env: { ...COMPLETE_S3, NODE_ENV: 'production', STORAGE_PROVIDER: 's3' },
    });

    getActiveStorageProvider(base);

    expect(calls).toEqual(['s3']);
  });
});
