import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { AppError } from '@/server/common/errors/app-error';
import type {
  StorageObjectUploadInput,
  StorageProvider,
} from '@/server/features/storage/storage.types';

export function createS3StorageProvider(input: CreateS3StorageProviderInput): StorageProvider {
  const client = new S3Client({
    credentials: {
      accessKeyId: input.accessKeyId,
      secretAccessKey: input.secretAccessKey,
    },
    endpoint: input.endpoint ?? undefined,
    forcePathStyle: input.forcePathStyle ?? false,
    region: input.region,
  });

  return {
    async deleteObject(key: string) {
      await client.send(new DeleteObjectCommand({ Bucket: input.bucket, Key: key }));
    },
    async downloadObject(key: string) {
      const result = await client.send(new GetObjectCommand({ Bucket: input.bucket, Key: key }));
      if (result.Body === undefined) {
        throw new AppError('S3 object not found', 404, 'S3_OBJECT_NOT_FOUND');
      }
      const bytes = await result.Body.transformToByteArray();
      return Buffer.from(bytes);
    },
    async getPresignedUrl(key: string, ttlSeconds: number) {
      void ttlSeconds;
      return `${trimTrailingSlash(input.publicUrlBase)}/${key}`;
    },
    async listObjects(prefix: string) {
      const result = await client.send(
        new ListObjectsV2Command({ Bucket: input.bucket, Prefix: prefix })
      );
      return (result.Contents ?? []).flatMap((item) => (item.Key === undefined ? [] : [item.Key]));
    },
    resolvePublicUrl(key: string) {
      return `${trimTrailingSlash(input.publicUrlBase)}/${key}`;
    },
    async uploadObject(uploadInput: StorageObjectUploadInput) {
      await client.send(
        new PutObjectCommand({
          Body: uploadInput.data,
          Bucket: input.bucket,
          ContentType: uploadInput.contentType,
          Key: uploadInput.key,
        })
      );
    },
  };
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

interface CreateS3StorageProviderInput {
  accessKeyId: string;
  bucket: string;
  endpoint?: string | null;
  forcePathStyle?: boolean;
  publicUrlBase: string;
  region: string;
  secretAccessKey: string;
}
