import { AppError } from '@/server/common/errors/app-error';
import { resourceIdPrefixes } from '@/server/common/constants/id-prefixes';
import { sniffMimeType } from '@/server/common/utils/mime-sniff';
import { createResourceId } from '@/server/common/utils/resource-id';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { insertMediaAsset } from '@/server/features/settings/repositories/media-assets.repository';
import {
  deleteObject,
  resolveImageUrl,
  uploadObject,
} from '@/server/features/storage/storage.service';
import { mediaCategoryFolder } from '@/server/features/settings/schemas/model/media-category.model';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { MediaCategory } from '@/server/features/settings/schemas/model/media-category.model';

// Minimal shape of the WHATWG File that graphql-yoga hands us for an Upload.
export interface UploadedFile {
  name: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export async function uploadMediaUseCase(
  input: UploadMediaInput,
  context: GqlContext,
  dependencies: UploadMediaDependencies = defaultDependencies
) {
  requireAdmin(context);
  const userId = context.user?.id;
  if (userId === undefined) {
    throw new AppError('Authenticated user is required', 401, 'UNAUTHENTICATED');
  }

  const data = Buffer.from(await input.file.arrayBuffer());

  if (data.byteLength === 0) {
    throw new AppError('Uploaded file is empty', 400, 'MEDIA_FILE_EMPTY');
  }

  if (data.byteLength > MAX_MEDIA_UPLOAD_BYTES) {
    throw new AppError(
      `Image is too large. Choose a file under ${MAX_MEDIA_UPLOAD_LABEL}.`,
      400,
      'MEDIA_TOO_LARGE'
    );
  }

  const mime = dependencies.sniffMimeType(data);

  if (mime === null) {
    throw new AppError('Unsupported file type', 400, 'MEDIA_MIME_UNSUPPORTED');
  }

  const id = dependencies.createId();
  const extension = extractExtension(mime);
  const key = buildStorageKey(input.category, dependencies.now(), id, extension);

  try {
    await dependencies.uploadObject({
      contentType: mime,
      data,
      key,
    });
  } catch (error) {
    // The storage provider is configuration, not code: a bad key, a rotated
    // secret or an unreachable bucket. GraphQL masks unexpected errors, so
    // without this the operator saw "Internal server error" and could not
    // tell a broken credential from a broken app.
    throw new AppError(
      `Storage rejected the upload: ${error instanceof Error ? error.message : String(error)}`,
      502,
      'STORAGE_UPLOAD_FAILED'
    );
  }

  const asset = await dependencies.insertMediaAsset({
    contentType: mime,
    id,
    originalFilename: input.file.name,
    sizeBytes: data.byteLength,
    storageKey: key,
    uploadedByUserId: userId,
  });
  if (asset === null) {
    await dependencies.deleteObject(key);
    throw new AppError(
      'Uploaded media metadata could not be persisted',
      500,
      'MEDIA_METADATA_CREATE_FAILED'
    );
  }

  const imageUrl = await dependencies.resolveImageUrl(key);
  return { ...asset, createdAt: asset.createdAt.toISOString(), imageUrl };
}

// Enforced on the raw file bytes; mirrors MAX_IMAGE_UPLOAD_BYTES on the client.
const MAX_MEDIA_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_MEDIA_UPLOAD_LABEL = '8 MB';

interface UploadMediaInput {
  file: UploadedFile;
  category: MediaCategory;
}

// Structured storage layout: media/<category>/<year>/<month>/<id>.<ext>
function buildStorageKey(
  category: MediaCategory,
  now: Date,
  id: string,
  extension: string
): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `media/${mediaCategoryFolder(category)}/${year}/${month}/${id}.${extension}`;
}

interface UploadMediaDependencies {
  createId: () => string;
  deleteObject: typeof deleteObject;
  insertMediaAsset: typeof insertMediaAsset;
  now: () => Date;
  resolveImageUrl: typeof resolveImageUrl;
  sniffMimeType: typeof sniffMimeType;
  uploadObject: typeof uploadObject;
}

function extractExtension(mimeType: string): string {
  const [, extension] = mimeType.split('/');
  if (extension === undefined || extension.length === 0) {
    return 'bin';
  }
  return extension;
}

const defaultDependencies: UploadMediaDependencies = {
  createId: () => createResourceId(resourceIdPrefixes.mediaAsset),
  deleteObject,
  insertMediaAsset,
  now: () => new Date(),
  resolveImageUrl,
  sniffMimeType,
  uploadObject,
};
