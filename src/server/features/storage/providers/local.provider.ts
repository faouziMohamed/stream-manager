import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  StorageObjectUploadInput,
  StorageProvider,
} from '@/server/features/storage/storage.types';

export function createLocalStorageProvider(options: LocalStorageProviderOptions): StorageProvider {
  return {
    async deleteObject(key: string) {
      const path = resolvePath(options.baseDir, key);
      await rm(path, { force: true });
    },
    async downloadObject(key: string) {
      const path = resolvePath(options.baseDir, key);
      return readFile(path);
    },
    async getPresignedUrl(key: string) {
      return `${trimTrailingSlash(options.publicBaseUrl)}/${normalize(key)}`;
    },
    async listObjects(prefix: string) {
      const dir = resolvePath(options.baseDir, prefix);
      const entries = await readdir(dir, { withFileTypes: true });
      return entries.filter((entry) => entry.isFile()).map((entry) => `${prefix}/${entry.name}`);
    },
    resolvePublicUrl(key: string) {
      return `${trimTrailingSlash(options.publicBaseUrl)}/${normalize(key)}`;
    },
    async uploadObject(input: StorageObjectUploadInput) {
      const path = resolvePath(options.baseDir, input.key);
      await mkdir(directoryName(path), { recursive: true });
      await writeFile(path, input.data);
    },
  };
}

function directoryName(path: string): string {
  const normalized = path.replaceAll('\\', '/');
  const index = normalized.lastIndexOf('/');
  return index <= 0 ? '.' : normalized.slice(0, index);
}

function resolvePath(baseDir: string, key: string): string {
  return path.join(baseDir, normalize(key));
}

function normalize(value: string): string {
  return path.normalize(value);
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

interface LocalStorageProviderOptions {
  baseDir: string;
  publicBaseUrl: string;
}
