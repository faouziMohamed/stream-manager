import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  deleteMediaAsset,
  findMediaAssetById,
} from '@/server/features/settings/repositories/media-assets.repository';
import { deleteObject } from '@/server/features/storage/storage.service';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { MediaAsset } from '@/server/features/settings/repositories/media-assets.repository';

export async function deleteMediaAssetUseCase(
  id: string,
  context: GqlContext,
  dependencies: DeleteMediaAssetDependencies = defaultDependencies
): Promise<MediaAsset> {
  requireAdmin(context);

  const asset = await dependencies.findMediaAssetById(id);
  if (asset === null) {
    throw new AppError('Media asset not found', 404, 'MEDIA_ASSET_NOT_FOUND');
  }

  await dependencies.deleteObject(asset.storageKey);
  const deletedAsset = await dependencies.deleteMediaAsset(id);
  if (deletedAsset === null) {
    throw new AppError(
      'Media asset metadata could not be deleted',
      500,
      'MEDIA_METADATA_DELETE_FAILED'
    );
  }

  return deletedAsset;
}

interface DeleteMediaAssetDependencies {
  deleteMediaAsset: (id: string) => Promise<MediaAsset | null>;
  deleteObject: (key: string) => Promise<void>;
  findMediaAssetById: (id: string) => Promise<MediaAsset | null>;
}

const defaultDependencies: DeleteMediaAssetDependencies = {
  deleteMediaAsset,
  deleteObject,
  findMediaAssetById,
};
